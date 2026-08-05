import React, { createContext, useContext, useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Theme } from '../constants/theme';

interface ModalContextType {
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
  isModalOpen: boolean;
}

const ModalContext = createContext<ModalContextType>({
  showModal: () => {},
  hideModal: () => {},
  isModalOpen: false,
});

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);

  const showModal = (content: React.ReactNode) => setModalContent(content);
  const hideModal = () => setModalContent(null);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, isModalOpen: Boolean(modalContent) }}>
      <View style={{ flex: 1 }}>
        {children}
        {modalContent && (
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={hideModal}>
              <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardWrap}
            >
              <View style={styles.modalCardContainer}>
                {modalContent}
                {/* White background extension filling any space behind keyboard */}
                <View style={styles.bottomFill} />
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </ModalContext.Provider>
  );
};

export const useAppModal = () => useContext(ModalContext);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 99999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  keyboardWrap: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalCardContainer: {
    width: '100%',
    backgroundColor: Theme.colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  bottomFill: {
    height: 100,
    backgroundColor: Theme.colors.bg,
    marginTop: -1,
  },
});
