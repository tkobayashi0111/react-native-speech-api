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
    path: ''
  };

  componentDidMount() {
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 16000,
      Channels: 1,
      AudioEncoding: 'amr_wb',
    });

    AudioRecorder.onProgress = ({ currentTime }) => {
      console.log(currentTime);
      if (currentTime >= 5) {
        this.stopRecording();
      }
    };
  }

  async startRecording() {
    console.log('start recording');
    return await AudioRecorder.startRecording();
  }

  async stopRecording() {
    const path = await AudioRecorder.stopRecording();
    console.log(path);
    this.setState({
      path,
    });
  }

  play() {
    const { path } = this.state;
    if (path === '') return;
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
