import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import Sound from 'react-native-sound';

const audioPath = AudioUtils.DocumentDirectoryPath + '/test.awb';

export default class App extends Component {
  state = {
    soundObj: null,
  };

  componentDidMount() {
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 16000,
      Channels: 1,
      AudioEncoding: 'amr_wb',
      IncludeBase64: true,
    });

    AudioRecorder.onProgress = ({ currentTime }) => {
      console.log(currentTime);
      if (currentTime >= 5) {
        AudioRecorder.stopRecording();
      }
    };

    AudioRecorder.onFinished = object => {
      console.log(object);
      this.setState({
        soundObj: object,
      });
    }
  }

  async startRecording() {
    console.log('start recording');
    return await AudioRecorder.startRecording();
  }

  play() {
    const { soundObj } = this.state;
    console.log(soundObj);
    if (!soundObj) return;

    const path = soundObj.audioFileURL.match(/file:\/\/(.*)/)[1];
    console.log(path);
    const sound = new Sound(path, Sound.DOCUMENT, (error) => {
      if (error) {
        console.log(error);
        return;
      }
      console.log('success load');
      sound.play((success) => {
        if (success) {
          console.log('finished');
        } else {
          console.log('decode error');
          sound.reset();
        }
      })
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Button
          title="録音"
          onPress={async () => this.startRecording()}
        />
        <Button
          title="再生"
          onPress={() => this.play()}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
