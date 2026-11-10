import React, { useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { SoundController } from './components/SoundController';
import { ProgressIndicator } from './components/ProgressIndicator';
import { UnknownUniverse } from './scenes/UnknownUniverse';
import { WorldThatBlooms } from './scenes/WorldThatBlooms';
import { LittleThings } from './scenes/LittleThings';
import { HeartOfLight } from './scenes/HeartOfLight';
import { FinalLetter } from './scenes/FinalLetter';
import { SoundProvider, useSound } from './systems/SoundManager';
import { content } from './config/content';
import { experience } from './config/experience';

const SCENE_COUNT = 5;

function Experience() {
  const [loading, setLoading] = useState(true);
  const [currentScene, setCurrentScene] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const { startMusic } = useSound();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), experience.minLoadingTime);
    return () => clearTimeout(timer);
  }, []);

  const goToNextScene = useCallback(() => {
    if (transitioning || currentScene >= SCENE_COUNT - 1) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentScene(prev => prev + 1);
      setTransitioning(false);
    }, 800);
  }, [currentScene, transitioning]);

  const restartExperience = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentScene(0);
      setTransitioning(false);
    }, 800);
  }, []);

  // Start music on first interaction after loading
  useEffect(() => {
    if (loading) return;
    const handleFirstClick = () => {
      startMusic();
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('touchstart', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick, { once: true });
    document.addEventListener('touchstart', handleFirstClick, { once: true });
    return () => {
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('touchstart', handleFirstClick);
    };
  }, [loading, startMusic]);

  if (loading) {
    return <LoadingScreen title={content.experienceTitle} subtitle={content.experienceSubtitle} />;
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      minHeight: '100dvh', maxHeight: '100dvh',
      overflow: 'hidden',
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000',
    }}>
      {transitioning && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: '#000', animation: 'fadeIn 0.4s ease forwards',
          pointerEvents: 'all',
        }} />
      )}
      <div style={{ width: '100%', height: '100%' }}>
        {currentScene === 0 && <UnknownUniverse onComplete={goToNextScene} isActive={true} />}
        {currentScene === 1 && <WorldThatBlooms onComplete={goToNextScene} isActive={true} />}
        {currentScene === 2 && <LittleThings onComplete={goToNextScene} isActive={true} />}
        {currentScene === 3 && <HeartOfLight onComplete={goToNextScene} isActive={true} />}
        {currentScene === 4 && <FinalLetter onRestart={restartExperience} isActive={true} />}
      </div>
      <ProgressIndicator current={currentScene} total={SCENE_COUNT} />
      <SoundController />
    </div>
  );
}

export default function App() {
  return (
    <SoundProvider>
      <Experience />
    </SoundProvider>
  );
}
