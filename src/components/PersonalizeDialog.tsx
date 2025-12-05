import { useState, useEffect } from 'react';
import { Paintbrush } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface DitherSettings {
  enabled: boolean;
  waveColor: [number, number, number];
  waveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  colorNum: number;
}

const DEFAULT_SETTINGS: DitherSettings = {
  enabled: true,
  waveColor: [0.5, 0.5, 0.5],
  waveAmplitude: 0.3,
  waveFrequency: 3,
  waveSpeed: 0.05,
  colorNum: 4,
};

const COLOR_PRESETS = [
  { name: 'Gray', color: [0.5, 0.5, 0.5] as [number, number, number] },
  { name: 'Blue', color: [0.2, 0.4, 0.8] as [number, number, number] },
  { name: 'Purple', color: [0.6, 0.3, 0.8] as [number, number, number] },
  { name: 'Green', color: [0.3, 0.7, 0.4] as [number, number, number] },
  { name: 'Orange', color: [0.9, 0.5, 0.2] as [number, number, number] },
  { name: 'Cyan', color: [0.2, 0.7, 0.8] as [number, number, number] },
];

export function PersonalizeDialog({ collapsed }: { collapsed: boolean }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ditherSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  const saveSettings = (newSettings: DitherSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ditherSettings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('ditherSettingsChanged', { detail: newSettings }));
  };

  const handleReset = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/10 text-white/90 backdrop-blur-sm border border-white/10 hover:border-white/25 transition-all duration-200 ${collapsed ? 'justify-center' : 'px-4'}`}>
          <Paintbrush className="h-4 w-4" />
          {!collapsed && <span>{t('settings.personalize') || 'Personalize'}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.personalize') || 'Personalize'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Enable/Disable Dither */}
          <div className="flex items-center justify-between">
            <Label htmlFor="dither-enabled">{t('settings.enableDither') || 'Enable Background Effect'}</Label>
            <Switch
              id="dither-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => saveSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Color Presets */}
              <div className="space-y-2">
                <Label>{t('settings.colorPreset') || 'Color Preset'}</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => saveSettings({ ...settings, waveColor: preset.color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        JSON.stringify(settings.waveColor) === JSON.stringify(preset.color)
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: `rgb(${preset.color[0] * 255}, ${preset.color[1] * 255}, ${preset.color[2] * 255})`,
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Wave Amplitude */}
              <div className="space-y-2">
                <Label>{t('settings.waveIntensity') || 'Wave Intensity'}: {Math.round(settings.waveAmplitude * 100)}%</Label>
                <Slider
                  value={[settings.waveAmplitude * 100]}
                  onValueChange={([value]) => saveSettings({ ...settings, waveAmplitude: value / 100 })}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              {/* Wave Speed */}
              <div className="space-y-2">
                <Label>{t('settings.waveSpeed') || 'Animation Speed'}: {Math.round(settings.waveSpeed * 1000)}%</Label>
                <Slider
                  value={[settings.waveSpeed * 1000]}
                  onValueChange={([value]) => saveSettings({ ...settings, waveSpeed: value / 1000 })}
                  min={10}
                  max={200}
                  step={10}
                />
              </div>

              {/* Color Depth */}
              <div className="space-y-2">
                <Label>{t('settings.colorDepth') || 'Color Depth'}: {settings.colorNum}</Label>
                <Slider
                  value={[settings.colorNum]}
                  onValueChange={([value]) => saveSettings({ ...settings, colorNum: value })}
                  min={2}
                  max={8}
                  step={1}
                />
              </div>
            </>
          )}

          {/* Reset Button */}
          <Button variant="outline" onClick={handleReset} className="w-full">
            {t('settings.resetDefaults') || 'Reset to Defaults'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
