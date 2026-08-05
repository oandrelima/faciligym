import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface AppModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({ visible, onClose, children }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  contentContainer: {
    width: '100%',
    zIndex: 10000,
  },
});
