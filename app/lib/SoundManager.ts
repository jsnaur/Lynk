import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

export enum AppSoundCategory {
  AlertError = "buzzes",
  Notification = "chimes",
  AuthError = "auth_buzzes",
  AuthSuccess = "glass_bells",
  SetupProgress = "setup_pings",
  BadgeEquip = "clinks",
  DailyReward = "chest_opens",
  LevelUp = "level_ups",
  QuestComplete = "fanfares",
  XpGain = "sparkles",
  ItemEquip = "item_equips",
  PurchaseError = "purchase_errors",
  PurchaseSuccess = "ka_chings",
  LikePost = "snaps",
  PostExpand = "swooshes",
  PostSent = "pops",
  ButtonPress = "ui_clicks",
  ModalClose = "thuds",
  ModalOpen = "thumps",
  NavSwitch = "whooshes",
  TabSwitch = "swishes",
}

type SoundAsset = number;

type SoundDefinition = {
  source?: SoundAsset;
  volume: number;
  defaultDebounceMs: number;
  notes: string;
};

export type PlaySoundOptions = {
  volume?: number;
  debounceMs?: number;
  force?: boolean;
  replayFromStart?: boolean;
  rate?: number;
  shouldCorrectPitch?: boolean;
};

export type PreloadSoundOptions = {
  setAudioMode?: boolean;
};

const SOUND_CATALOG: Record<AppSoundCategory, SoundDefinition> = {
  [AppSoundCategory.AlertError]: {
    source: require("../../assets/sfx/alerts/alert_error.wav"),
    volume: 1,
    defaultDebounceMs: 180,
    notes: "Warning/error feedback.",
  },
  [AppSoundCategory.Notification]: {
    source: require("../../assets/sfx/alerts/notification.wav"),
    volume: 0.95,
    defaultDebounceMs: 180,
    notes: "Notification and gentle success cues.",
  },
  [AppSoundCategory.AuthError]: {
    source: require("../../assets/sfx/auth/auth_error.wav"),
    volume: 0.82,
    defaultDebounceMs: 140,
    notes: "Authentication error feedback.",
  },
  [AppSoundCategory.AuthSuccess]: {
    source: require("../../assets/sfx/auth/auth_success.wav"),
    volume: 0.9,
    defaultDebounceMs: 220,
    notes: "Delicate success or confirmation cue.",
  },
  [AppSoundCategory.SetupProgress]: {
    source: require("../../assets/sfx/auth/setup_progress.wav"),
    volume: 0.84,
    defaultDebounceMs: 70,
    notes: "Progress feedback during setup flows.",
  },
  [AppSoundCategory.BadgeEquip]: {
    source: require("../../assets/sfx/gamification/badge_equip.wav"),
    volume: 0.85,
    defaultDebounceMs: 100,
    notes: "Small metallic success cue.",
  },
  [AppSoundCategory.DailyReward]: {
    source: require("../../assets/sfx/gamification/daily_reward.wav"),
    volume: 1,
    defaultDebounceMs: 250,
    notes: "Chest/reward reveal moments.",
  },
  [AppSoundCategory.LevelUp]: {
    source: require("../../assets/sfx/gamification/level_up.wav"),
    volume: 1,
    defaultDebounceMs: 500,
    notes: "Level-up progression cue.",
  },
  [AppSoundCategory.QuestComplete]: {
    source: require("../../assets/sfx/gamification/quest_complete.wav"),
    volume: 1,
    defaultDebounceMs: 300,
    notes: "Quest completion or celebratory moments.",
  },
  [AppSoundCategory.XpGain]: {
    source: require("../../assets/sfx/gamification/xp_gain.wav"),
    volume: 0.9,
    defaultDebounceMs: 45,
    notes: "Rapid XP tick and sparkle-like feedback.",
  },
  [AppSoundCategory.ItemEquip]: {
    source: require("../../assets/sfx/shop/item_equip.wav"),
    volume: 0.92,
    defaultDebounceMs: 120,
    notes: "Equipping shop items.",
  },
  [AppSoundCategory.PurchaseError]: {
    source: require("../../assets/sfx/shop/purchase_error.wav"),
    volume: 0.92,
    defaultDebounceMs: 140,
    notes: "Purchase failure or insufficient funds.",
  },
  [AppSoundCategory.PurchaseSuccess]: {
    source: require("../../assets/sfx/shop/purchase_success.wav"),
    volume: 1,
    defaultDebounceMs: 200,
    notes: "Purchase/currency success cue.",
  },
  [AppSoundCategory.LikePost]: {
    source: require("../../assets/sfx/social/like_post.wav"),
    volume: 0.85,
    defaultDebounceMs: 80,
    notes: "Quick affirmation cue.",
  },
  [AppSoundCategory.PostExpand]: {
    source: require("../../assets/sfx/social/post_expand.wav"),
    volume: 0.9,
    defaultDebounceMs: 100,
    notes: "Panel/card expansion transitions.",
  },
  [AppSoundCategory.PostSent]: {
    source: require("../../assets/sfx/social/post_sent.wav"),
    volume: 0.9,
    defaultDebounceMs: 90,
    notes: "Message/post completion cue.",
  },
  [AppSoundCategory.ButtonPress]: {
    source: require("../../assets/sfx/ui/button_press.wav"),
    volume: 1,
    defaultDebounceMs: 50,
    notes: "Primary tap/click interactions.",
  },
  [AppSoundCategory.ModalClose]: {
    source: require("../../assets/sfx/ui/modal_close.wav"),
    volume: 0.9,
    defaultDebounceMs: 120,
    notes: "Muted impact cue.",
  },
  [AppSoundCategory.ModalOpen]: {
    source: require("../../assets/sfx/ui/modal_open.wav"),
    volume: 0.9,
    defaultDebounceMs: 120,
    notes: "Heavier impact-style transitions.",
  },
  [AppSoundCategory.NavSwitch]: {
    source: require("../../assets/sfx/ui/nav_switch.wav"),
    volume: 0.65,
    defaultDebounceMs: 100,
    notes: "Fast navigation movement cues.",
  },
  [AppSoundCategory.TabSwitch]: {
    source: require("../../assets/sfx/ui/tab_switch.wav"),
    volume: 0.9,
    defaultDebounceMs: 80,
    notes: "Light directional movement cues.",
  },
};

const now = (): number => Date.now();

class SoundManager {
  private loadedSounds = new Map<AppSoundCategory, Audio.Sound>();
  private lastPlayedAt = new Map<AppSoundCategory, number>();
  private preloadInFlight = new Map<AppSoundCategory, Promise<Audio.Sound | null>>();
  private audioModeConfigured = false;
  private enabled = true;

  public getCatalog(): Readonly<Record<AppSoundCategory, SoundDefinition>> {
    return SOUND_CATALOG;
  }

  public setEnabled(isEnabled: boolean): void {
    this.enabled = isEnabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async preloadAll(options: PreloadSoundOptions = {}): Promise<void> {
    await this.preloadMany(Object.values(AppSoundCategory), options);
  }

  public async preloadMany(
    categories: AppSoundCategory[],
    options: PreloadSoundOptions = {},
  ): Promise<void> {
    if (options.setAudioMode) {
      await this.ensureAudioModeConfigured();
    }

    await Promise.all(
      categories.map(async (category) => {
        await this.ensureLoaded(category);
      }),
    );
  }

  public async play(
    category: AppSoundCategory,
    options: PlaySoundOptions = {},
  ): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const definition = SOUND_CATALOG[category];
    if (!definition?.source) {
      console.warn(`[SoundManager] No source configured for category: ${category}`);
      return false;
    }

    const debounceMs = options.debounceMs ?? definition.defaultDebounceMs;
    if (!options.force && this.isDebounced(category, debounceMs)) {
      return false;
    }

    try {
      const sound = await this.ensureLoaded(category);
      if (!sound) {
        return false;
      }

      const volume = options.volume ?? definition.volume;
      await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));

      if (options.rate != null) {
        const clampedRate = Math.max(0.5, Math.min(2, options.rate));
        try {
          await sound.setRateAsync(
            clampedRate,
            options.shouldCorrectPitch ?? true,
          );
        } catch {
          // Some runtimes do not support rate changes for all codecs/devices.
        }
      }

      if (options.replayFromStart ?? true) {
        await sound.replayAsync();
      } else {
        await sound.playAsync();
      }

      this.lastPlayedAt.set(category, now());
      return true;
    } catch (error) {
      console.warn(
        `[SoundManager] Failed to play sound for ${category}.`,
        error,
      );
      return false;
    }
  }

  public async stop(category: AppSoundCategory): Promise<void> {
    const sound = this.loadedSounds.get(category);
    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch (error) {
      console.warn(`[SoundManager] Failed to stop sound for ${category}.`, error);
    }
  }

  public async unload(category: AppSoundCategory): Promise<void> {
    const sound = this.loadedSounds.get(category);
    if (!sound) {
      return;
    }

    try {
      await sound.unloadAsync();
    } catch (error) {
      console.warn(`[SoundManager] Failed to unload sound for ${category}.`, error);
    } finally {
      this.loadedSounds.delete(category);
      this.lastPlayedAt.delete(category);
      this.preloadInFlight.delete(category);
    }
  }

  public async unloadAll(): Promise<void> {
    const categories = Array.from(this.loadedSounds.keys());
    await Promise.all(categories.map(async (category) => this.unload(category)));
  }

  public async playAuthSuccessChime(): Promise<void> {
    await this.play(AppSoundCategory.AuthSuccess, {
      force: true,
      debounceMs: 0,
      volume: 1,
      rate: 1.03,
    });
  }

  public async playAuthErrorBuzz(): Promise<void> {
    await this.play(AppSoundCategory.AuthError, {
      force: true,
      debounceMs: 0,
      volume: 1,
      rate: 1.0,
      shouldCorrectPitch: false,
    });
  }

  public async playProgressDing(progressRatio = 0): Promise<void> {
    const clamped = Math.max(0, Math.min(1, progressRatio));
    const rate = 1.02 + clamped * 0.26;
    await this.play(AppSoundCategory.SetupProgress, {
      force: true,
      debounceMs: 0,
      volume: 0.82,
      rate,
    });
  }

  private isDebounced(category: AppSoundCategory, debounceMs: number): boolean {
    if (debounceMs <= 0) {
      return false;
    }

    const lastPlayed = this.lastPlayedAt.get(category);
    if (!lastPlayed) {
      return false;
    }

    return now() - lastPlayed < debounceMs;
  }

  private async ensureLoaded(
    category: AppSoundCategory,
  ): Promise<Audio.Sound | null> {
    const existing = this.loadedSounds.get(category);
    if (existing) {
      return existing;
    }

    const definition = SOUND_CATALOG[category];
    const source = definition?.source;
    if (source == null) {
      return null;
    }

    const inFlight = this.preloadInFlight.get(category);
    if (inFlight) {
      return inFlight;
    }

    const loadPromise = (async () => {
      try {
        const sound = new Audio.Sound();
        await sound.loadAsync(source, { shouldPlay: false });
        this.loadedSounds.set(category, sound);
        return sound;
      } catch (error) {
        console.warn(
          `[SoundManager] Failed to preload sound for ${category}.`,
          error,
        );
        return null;
      } finally {
        this.preloadInFlight.delete(category);
      }
    })();

    this.preloadInFlight.set(category, loadPromise);
    return loadPromise;
  }

  private async ensureAudioModeConfigured(): Promise<void> {
    if (this.audioModeConfigured) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.audioModeConfigured = true;
    } catch (error) {
      console.warn("[SoundManager] Failed to configure audio mode.", error);
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

export const appSoundManager = new SoundManager();

export const AppSounds = {
  manager: appSoundManager,
  category: AppSoundCategory,
} as const;

export default appSoundManager;
