import { useEffect, useRef, useState } from 'react';
import { BellRing, Play, Square, Upload, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/database';
import { readCustomAlertAudio } from '../lib/customAlertAudio';
import { validAlertLeadMinutes, type TimerAlertSound } from '../lib/timerAlerts';
import { Modal } from './Modal';
import { NeoSelect } from './NeoSelect';
import { serverZones, useTimers } from './TimerProvider';

export function TimerAlertControls() {
  const { t } = useTranslation();
  const { timeZone, changeZone, alertLeadMinutes } = useTimers();
  const [dialog, setDialog] = useState<'lead' | 'sound' | null>(null);
  return <div className="timer-alert-controls">
    <button type="button" className="icon-button" aria-label={t('alertLeadSettings')} title={`${t('alertLeadSettings')} · ${alertLeadMinutes} min`} aria-haspopup="dialog" onClick={() => setDialog('lead')}><BellRing size={22} strokeWidth={2.5} aria-hidden="true" /></button>
    <button type="button" className="icon-button" aria-label={t('alertSoundSettings')} title={t('alertSoundSettings')} aria-haspopup="dialog" onClick={() => setDialog('sound')}><Volume2 size={22} strokeWidth={2.5} aria-hidden="true" /></button>
    <label className="server-zone-picker"><span>{t('serverTimeZone')}</span><NeoSelect ariaLabel={t('serverTimeZone')} value={timeZone} onChange={value => changeZone(String(value))} options={serverZones.map(zone => ({ value: zone.value, label: t(zone.labelKey) }))} /></label>
    {dialog === 'lead' && <LeadTimeDialog onClose={() => setDialog(null)} />}
    {dialog === 'sound' && <SoundDialog onClose={() => setDialog(null)} />}
  </div>;
}

function LeadTimeDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { alertLeadMinutes, changeAlertLeadMinutes } = useTimers();
  const [minutes, setMinutes] = useState(String(alertLeadMinutes));
  return <Modal title={t('alertLeadSettings')} onClose={onClose}>
    <form className="alert-settings-form" onSubmit={event => {
      event.preventDefault();
      if (!validAlertLeadMinutes(Number(minutes))) return;
      changeAlertLeadMinutes(Number(minutes));
      onClose();
    }}>
      <p>{t('alertSettingsAppliesToAll')}</p>
      <div className="alert-lead-presets" role="group" aria-label={t('alertLeadPresets')}>{[1, 3, 5, 10, 15, 30].map(value => <button type="button" className="button button-secondary" key={value} aria-pressed={Number(minutes) === value} onClick={() => setMinutes(String(value))}>{value} min</button>)}</div>
      <label className="field"><span>{t('alertMinutesBefore')}</span><input type="number" min={1} max={60} step={1} required value={minutes} onChange={event => setMinutes(event.target.value)} aria-describedby="alert-lead-help" /></label>
      <p id="alert-lead-help" className="field-help">{t('alertLeadRange')}</p>
      <div className="form-actions"><button type="button" className="button button-secondary" onClick={onClose}>{t('cancel')}</button><button type="submit" className="button button-primary">{t('save')}</button></div>
    </form>
  </Modal>;
}

function SoundDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { alertSound, alertSoundSource, customAudio, changeAlertSound } = useTimers();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const preview = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio(alertSoundSource);
    audio.onended = () => setPlaying(false);
    preview.current = audio;
    setPlaying(false);
    return () => { audio.pause(); audio.onended = null; preview.current = null; };
  }, [alertSoundSource]);
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const audio = await readCustomAlertAudio(file);
      await db.preferences.update('main', { timerAlertAudio: audio });
      changeAlertSound('custom');
    } catch { setError(t('alertAudioFileError')); }
    finally { setBusy(false); }
  }
  async function togglePreview() {
    const audio = preview.current;
    if (!audio) return;
    setError('');
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); return; }
    try { await audio.play(); setPlaying(true); }
    catch { setError(t('alertAudioPlayError')); }
  }
  return <Modal title={t('alertSoundSettings')} onClose={onClose}>
    <div className="alert-settings-form">
      <p>{t('alertSettingsAppliesToAll')}</p>
      <label className="field"><span>{t('alertSoundChoice')}</span><NeoSelect ariaLabel={t('alertSoundChoice')} value={customAudio || alertSound !== 'custom' ? alertSound : 'default'} onChange={value => { setError(''); changeAlertSound(String(value) as TimerAlertSound); }} options={[
        { value: 'default', label: t('alertSoundDefault') },
        { value: 'completion', label: t('alertSoundCompletion') },
        ...(customAudio ? [{ value: 'custom', label: customAudio.name }] : []),
      ]} /></label>
      <button type="button" className="button button-secondary" onClick={() => void togglePreview()}>{playing ? <Square size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{t(playing ? 'alertStopPreview' : 'alertPreview')}</button>
      <label className={`button button-primary alert-upload${busy ? ' is-busy' : ''}`}><Upload size={18} aria-hidden="true" />{t(busy ? 'alertAudioLoading' : 'alertUploadAudio')}<input type="file" accept="audio/*" disabled={busy} aria-label={t('alertUploadAudio')} aria-describedby="alert-audio-help" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /></label>
      <p id="alert-audio-help" className="field-help">{t('alertAudioFileHelp')}</p>
      {error && <p className="alert-settings-error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="button button-secondary" onClick={onClose}>{t('close')}</button></div>
    </div>
  </Modal>;
}
