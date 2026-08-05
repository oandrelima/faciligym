import React, { useRef, useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Theme } from '../../constants/theme';
import { IconHome, IconDumbbell, IconMessage, IconRing, IconGear } from '../../components/Icons';
import { useAppModal } from '../../context/ModalContext';

const TAB_ICONS: Record<string, React.FC<{ color: string; size: number }>> = {
  index: IconHome,
  workouts: IconDumbbell,
  chat: IconMessage,
  diet: IconRing,
  settings: IconGear,
};

function FloatingSlidingTabBar({ state, navigation }: any) {
  const { isModalOpen } = useAppModal();
  const activeIndex = state.index;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  const paddingHorizontal = 12;
  const numTabs = state.routes.length;
  const availableWidth = barWidth > 0 ? barWidth - paddingHorizontal * 2 : 0;
  const tabStepWidth = availableWidth > 0 ? availableWidth / numTabs : 0;

  useEffect(() => {
    if (tabStepWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeIndex * tabStepWidth,
        tension: 150,
        friction: 13,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, tabStepWidth]);

  // If a modal window is open, hide the floating tab bar so the modal and backdrop are 100% on top
  if (isModalOpen) {
    return null;
  }

  return (
    <View
      style={styles.tabBar}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* ── Sliding Red Background Pill ────────────────── */}
      {tabStepWidth > 0 && (
        <Animated.View
          style={[
            styles.slidingPill,
            {
              width: tabStepWidth,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.pillInner} />
        </Animated.View>
      )}

      {/* ── Tab Buttons ───────────────────────────────── */}
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const IconComponent = TAB_ICONS[route.name] || IconHome;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabBtn}
            activeOpacity={0.8}
          >
            <IconComponent
              color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
              size={20}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingSlidingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="diet" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 60,
    backgroundColor: '#121212',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 100,
  },
  slidingPill: {
    position: 'absolute',
    left: 12,
    top: 10,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInner: {
    width: '85%',
    height: '100%',
    backgroundColor: Theme.colors.red,
    borderRadius: 20,
    shadowColor: Theme.colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
