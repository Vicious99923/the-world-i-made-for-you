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
import { experience, SceneKey } from './config/experience';

const SCENES: SceneKey[] = ['unknownUniverse', 'worldThatBlooms', 'littleThings', 'heartOfLight', 'finalLetter'];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentScene, setCurrentScene] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), experience.minLoadingTime);
    return () => clearTimeout(timer);
  }, []);

  const goToNextScene = useCallback(() => {
    if (transitioning || currentScene >= SCENES.length - 1) return;
    setTransitioning(true);
    setSceneVisible(false);
    setTimeout(() => {
      setCurrentScene(prev => prev + 1);
      setSceneVisible(true);
      setTimeout(() => setTransitioning(false), 100);
    }, 1200);
  }, [currentScene, transitioning]);

  const restartExperience = useCallback(() => {
    setTransitioning(true);
    setSceneVisible(false);
    setTimeout(() => {
      setCurrentScene(0);
      setSceneVisible(true);
      setTimeout(() => setTransitioning(false), 100);
    }, 1200);
  }, []);

  if (loading) {
    return <LoadingScreen title={content.experienceTitle} subtitle={content.experienceSubtitle} />;
  }

  const sceneComponents = [
    <UnknownUniverse key="s1" onComplete={goToNextScene} isActive={currentScene === 0} />,
    <WorldThatBlooms key="s2" onComplete={goToNextScene} isActive={currentScene === 1} />,
    <LittleThings key="s3" onComplete={goToNextScene} isActive={currentScene === 2} />,
    <HeartOfLight key="s4" onComplete={goToNextScene} isActive={currentScene === 3} />,
    <FinalLetter key="s5" onRestart={restartExperience} isActive={currentScene === 4} />,
  ];

  return (
    <SoundProvider>
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden', 
        position: 'fixed',
        top: 0, left: 0,
        background: '#000'
      }}>
        <div
          style={{
            opacity: sceneVisible ? 1 : 0,
            transition: 'opacity 1.2s cubic-bezier(0.83, 0, 0.17, 1)',
            width: '100%',
            height: '100%',
          }}
        >
          {sceneComponents[currentScene]}
        </div>
        <ProgressIndicator current={currentScene} total={SCENES.length} />
        <SoundController />
      </div>
    </SoundProvider>
  );
}
