import React, { useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { SoundController } from './components/SoundController';
import { ProgressIndicator } from './components/ProgressIndicator';
import { UnknownUniverse } from './scenes/UnknownUniverse';
import { WorldThatBlooms } from './scenes/WorldThatBlooms';
import { LittleThings } from './scenes/LittleThings';
import { HeartOfLight } from './scenes/HeartOfLight';
import { FinalLetter } from './scenes/FinalLetter';
import { SoundProvider } from './systems/SoundManager';
import { content } from './config/content';
import { experience } from './config/experience';

const SCENE_COUNT = 5;

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentScene, setCurrentScene] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), experience.minLoadingTime);
    return () => clearTimeout(timer);
  }, []);

  const goToNextScene = useCallback(() => {
    if (transitioning || currentScene >= SCENE_COUNT - 1) return;
    setTransitioning(true);
    // Simple fade: just switch after a short delay
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

  if (loading) {
    return <LoadingScreen title={content.experienceTitle} subtitle={content.experienceSubtitle} />;
  }

  return (
    <SoundProvider>
      <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0, left: 0,
        background: '#000',
      }}>
        {/* Transition overlay */}
        {transitioning && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: '#000',
            animation: 'fadeIn 0.4s ease forwards',
            pointerEvents: 'all',
          }} />
        )}

        {/* Scenes */}
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
    </SoundProvider>
  );
}
