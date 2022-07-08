import { Camera, CameraType } from 'expo-camera';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { Environment } from '../config/environments';

export const Entry = () => {
  const [isVisible, setVisible] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const sendApi = useCallback(async (base64: string) => {
    const body = JSON.stringify({
      requests: [
        {
          features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
          image: {
            content: base64,
          },
        },
      ],
    });
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${Environment.API_KEY}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body,
    });
    const resJson = await response.json();
    setVisible(true);
    setResults(resJson.responses[0].labelAnnotations.map((annotation: any) => annotation.description));
  }, []);

  const onPress = useCallback(async () => {
    const result = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0 });
    await sendApi(result?.base64 || '');
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (!hasPermission) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={CameraType.back} ratio="1:1">
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={onPress}>
            {isVisible ? (
              <View>
                <Text style={styles.text}>{results.join('\n')}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
});
