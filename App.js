import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, Button } from 'react-native';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import Sound from 'react-native-sound';
import RNFetchBlob from 'rn-fetch-blob';
import API_KEY from './src/apikey';

const audioPath = AudioUtils.DocumentDirectoryPath + '/test.awb';

export default class App extends Component {
  state = {
    soundObj: null,
    isRecording: false,
    isPlaying: false,
    text: ''
  };

  componentDidMount() {
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
        isRecording: false
      });
      this.recognize(object.audioFileURL);
    };
  }

  async startRecording() {
    await AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 8000,
      Channels: 1,
      AudioEncoding: 'amr_nb'
    });

    console.log('start recording');
    this.setState({
      isRecording: true
    });
    return await AudioRecorder.startRecording();
  }

  play() {
    const { soundObj } = this.state;
    console.log(soundObj);
    if (!soundObj) return;

    const path = soundObj.audioFileURL.match(/file:\/\/(.*)/)[1];
    console.log(path);
    const sound = new Sound(path, Sound.DOCUMENT, error => {
      if (error) {
        console.log(error);
        return;
      }
      console.log('success load');
      sound.play(success => {
        if (success) {
          console.log('finished');
        } else {
          console.log('decode error');
          sound.reset();
        }
        this.setState({
          isPlaying: false
        });
      });
      this.setState({
        isPlaying: true
      });
    });
  }

  recognize(path) {
    this.fileToBase64(path)
      .then(content => {
        const url = `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`;
        const config = {
          encoding: 'AMR',
          languageCode: 'ja-JP',
          sampleRateHertz: 8000
        };
        const audio = {
          content
        };

        const params = {
          config,
          audio
        };

        console.log('fetch');
        return fetch(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
      })
      .then(res => res.json())
      .then(res => {
        console.log(res.results);
        const text = res.results[0].alternatives[0].transcript;
        this.setState({
          text
        });
      })
      .catch(console.error);
  }

  fileToBase64(path) {
    return new Promise((resolve, reject) => {
      let data = '';
      RNFetchBlob.fs.readStream(path, 'base64', 4095).then(ifstream => {
        ifstream.open();
        ifstream.onData(chunk => {
          // when encoding is `ascii`, chunk will be an array contains numbers
          // otherwise it will be a string
          data += chunk;
        });
        ifstream.onError(reject);
        ifstream.onEnd(() => resolve(data));
      });
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Button
          title="録音"
          disabled={this.state.isRecording || this.state.isPlaying}
          onPress={() => this.startRecording()}
        />
        <Button
          title="再生"
          disabled={
            !this.state.soundObj ||
            this.state.isRecording ||
            this.state.isPlaying
          }
          onPress={() => this.play()}
        />
        <Text>{this.state.text}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  }
});
