import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { withOpacity } from '../constants/colors';
import { useTheme } from './ThemeContext';
import { FONTS } from './../constants/fonts';

export type AlertButton = {
  text: string;
  style?: 'cancel' | 'default';
  onPress?: () => void;
};

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  content?: ReactNode;
};

type AlertContextType = {
  alert: (title: string, message?: string, buttons?: AlertButton[], content?: ReactNode) => void;
};

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [config, setConfig] = useState<AlertOptions | null>(null);

  const alert = (title: string, message?: string, buttons?: AlertButton[], content?: ReactNode) => {
    setConfig({ title, message, buttons, content });
  };

  const close = () => {
    setConfig(null);
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={[styles.modalOverlay, { backgroundColor: withOpacity(colors.bg, 0.6) }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{config?.title}</Text>
            
            {!!config?.message && (
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{config?.message}</Text>
            )}

            {!!config?.content && <View style={styles.modalCustomContent}>{config.content}</View>}
            
            <View style={styles.modalButtonRow}>
              {config?.buttons && config.buttons.length > 0 ? (
                config.buttons.map((btn, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.modalBtn,
                      btn.style === 'cancel'
                        ? [styles.modalBtnCancel, { borderColor: colors.border }]
                        : [styles.modalBtnConfirm, { backgroundColor: colors.xp }],
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      close();
                      if (btn.onPress) btn.onPress();
                    }}
                  >
                    <Text 
                      style={
                        btn.style === 'cancel' 
                          ? [styles.modalBtnTextCancel, { color: colors.textPrimary }] 
                          : [styles.modalBtnTextConfirm, { color: colors.textPrimary }]
                      }
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    styles.modalBtnConfirm,
                    { backgroundColor: colors.xp },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={close}
                >
                  <Text style={[styles.modalBtnTextConfirm, { color: colors.textPrimary }]}>OK</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within an AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONTS.display,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalCustomContent: {
    width: '100%',
    marginBottom: 18,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalBtnConfirm: {
  },
  modalBtnTextCancel: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
  },
  modalBtnTextConfirm: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
  },
});