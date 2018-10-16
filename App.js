import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, Button, ProgressBarAndroid } from 'react-native';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import Sound from 'react-native-sound';
import RNFetchBlob from 'rn-fetch-blob';
import API_KEY from './src/apikey';

const audioPath = AudioUtils.DocumentDirectoryPath + '/test.awb';

export default class App extends Component {
  state = {
    audioFileURL: null,
    isRecording: false,
    isPlaying: false,
    text: ''
  };

  componentDidMount() {
    AudioRecorder.onProgress = ({ currentTime }) => {
      console.log(currentTime);
      if (currentTime >= 59) {
        this.stopRecording();
      }
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
      isRecording: true,
      text: ''
    });
    return await AudioRecorder.startRecording();
  }

  async stopRecording() {
    const path = await AudioRecorder.stopRecording();
    this.setState({
      audioFileURL: path,
      isRecording: false,
      isRecognizing: false,
    });
    this.recognize(path);
  }

  play() {
    const { path } = this.state;
    if (!path) return;

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
    this.setState({
      isRecognizing: true,
    });
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
        console.log(res);
        const text = res.results ? res.results[0].alternatives[0].transcript : 'よく聞き取れませんでした＼(^o^)／';
        this.setState({
          isRecognizing: false,
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
        <View style={styles.container}>
          <Text style={styles.text}>{this.state.text}</Text>
        </View>
        {this.state.isRecognizing &&
          <View style={styles.progressContainer}>
            <ProgressBarAndroid styleAttr="Horizontal" />
          </View>
        }
        <Button
          title={this.state.isRecording ? '録音終了' : '録音開始'}
          disabled={this.state.isPlaying || this.state.isRecognizing}
          onPress={() => this.state.isRecording ? this.stopRecording() : this.startRecording()}
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
    paddingBottom: 32,
    backgroundColor: '#F5FCFF'
  },
  text: {
    fontSize: 32
  },
  progressContainer: {
    width: '100%',
    justifyContent: 'space-evenly',
    padding: 10
  }
});
