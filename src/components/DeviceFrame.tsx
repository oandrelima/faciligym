import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Theme } from '../constants/theme';

export const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'google-font-jakarta';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.id = 'google-font-global-style';
        style.textContent = `
          body, input, button, textarea, select, text, div, span {
            font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1, backgroundColor: Theme.colors.bg }}>{children}</View>;
  }

  return (
    <View style={styles.wrapper}>
      {/* Soft background gradient feel */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      {/* iPhone frame */}
      <View style={styles.frame}>
        {/* Physical side buttons */}
        <View style={[styles.btnLeft, { top: 70 }]} />
        <View style={[styles.btnLeft, { top: 115 }]} />
        <View style={[styles.btnLeft, { top: 155 }]} />
        <View style={[styles.btnRight, { top: 125 }]} />

        {/* Screen */}
        <View style={styles.screen}>
          {/* Dynamic Island */}
          <View style={styles.island}>
            <View style={styles.camera} />
          </View>

          {/* Content area */}
          <View style={styles.content}>
            {children}
          </View>

          {/* Home indicator */}
          <View style={styles.homeBar} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute',
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(232, 53, 74, 0.06)',
    top: '5%', right: '10%',
    filter: 'blur(60px)' as any,
  },
  bgBlob2: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    bottom: '10%', left: '10%',
    filter: 'blur(50px)' as any,
  },
  frame: {
    width: 393,
    height: 852,
    borderRadius: 54,
    backgroundColor: Theme.colors.bg,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `
      0 0 0 8px #D8D8D8,
      0 0 0 9.5px #C8C8C8,
      0 30px 80px rgba(0,0,0,0.22),
      0 10px 30px rgba(0,0,0,0.12)
    ` as any,
  },
  btnLeft: {
    position: 'absolute', left: -3, width: 3, height: 30,
    backgroundColor: '#C0C0C0', borderRadius: 2, zIndex: 10,
  },
  btnRight: {
    position: 'absolute', right: -3, top: 125, width: 3, height: 55,
    backgroundColor: '#C0C0C0', borderRadius: 2, zIndex: 10,
  },
  screen: {
    flex: 1,
    borderRadius: 53,
    overflow: 'hidden',
    backgroundColor: Theme.colors.bg,
  },
  island: {
    position: 'absolute', top: 12, alignSelf: 'center',
    width: 120, height: 32, backgroundColor: '#111',
    borderRadius: 20, zIndex: 999,
    alignItems: 'flex-end', justifyContent: 'center', paddingRight: 10,
  },
  camera: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#1A1A1A',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    flex: 1, paddingTop: 50,
    backgroundColor: Theme.colors.bg,
  },
  homeBar: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    width: 134, height: 4,
    backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 2, zIndex: 999,
  },
});
