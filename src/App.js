import React, { Component } from 'react';
import firebase from '@firebase/app';
import '@firebase/firestore'
var { BlockPicker } = require('react-color');
var config = require('./config/firebase.json');

firebase.initializeApp(config);

const firestore = firebase.firestore();

firestore.settings({
  timestampsInSnapshots: true
})

const PIXEL_SIZE = 20

function Pixels({ pixels_list = [], style = {}, onClick = () => { } } = {}) {
  var list = pixels_list.map((pixel, index) => (
    <span style={{
      position: 'absolute',
      left: pixel.x * PIXEL_SIZE,
      top: pixel.y * PIXEL_SIZE,
      width: PIXEL_SIZE,
      height: PIXEL_SIZE,
      backgroundColor: pixel.color
    }} key={index}></span>
  ))
  return (
    <div style={style} onClick={onClick}>
      {list}
    </div>
  )
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      pixels_list: [
      ],
      selected_pixel: null,
      intro_state: true
    }
  }
  handlePixelClick({ clientX, clientY }) {
    var pixel = {
      x: Math.floor(clientX / PIXEL_SIZE),
      y: Math.floor(clientY / PIXEL_SIZE)
    }
    if ((pixel.x * PIXEL_SIZE + PIXEL_SIZE) >= window.innerWidth) {
      pixel.x --;
    } 
    if ((pixel.y * PIXEL_SIZE + PIXEL_SIZE) >= window.innerHeight) {
      pixel.y --;
    }
    this.setState({
      selected_pixel: pixel,
      intro_state: false
    })
  }
  handleColorPicker({hex}){
    var pixel = {
      ...this.state.selected_pixel,
      color : hex
    }
    var pixel_match = this.state.pixels_list.find(e=>e.x == pixel.x && e.y == pixel.y);
    if (!pixel_match) {
      this.setState({
        pixels_list: this.state.pixels_list.concat(pixel),
        selected_pixel: null
      })
      firebase.firestore().collection("pixels").add(pixel)
    }else{
      pixel_match.color = hex;
      this.setState({
        pixels_list: this.state.pixels_list,
        selected_pixel: null
      })
      firebase.firestore().collection("pixels").doc(pixel_match.id).set(pixel)
    }
  }
  componentDidMount() {
    firebase
      .firestore()
      .collection("pixels")
      .get().then(coll => {
        this.setState({
          pixels_list: coll.docs.map(doc => ({...doc.data(), id: doc.id}))
        })
      })
      firebase
        .firestore()
        .collection("pixels")
        .onSnapshot(coll => 
          this.setState({
            pixels_list: coll.docs.map(doc => ({...doc.data(), id: doc.id}))
          })
        )
  }
  render() {
    return (
      <div className="App" style={{
        position: 'absolute',
        width: '100%',
        height: '100%'
      }} >
        {this.state.intro_state ? <h1 style={{
          textAlign: 'center',
          fontSize: 100,
          marginTop: 150,
          zIndex: 1,
          color: '#bfbfbf'
        }}>Click Anywhere To Draw</h1> : ''}
        <Pixels pixels_list={this.state.pixels_list} onClick={this.handlePixelClick.bind(this)} style={{
          position: 'absolute',
          width: '100%',
          top: 0,
          left: 0,
          zIndex: 0,
          height: '100%',
          overflow: 'hidden'
        }} />
        {
          this.state.selected_pixel && <div style={{
            position: 'absolute',
            zIndex: 1,
            left: Math.min(Math.max(0, this.state.selected_pixel.x * PIXEL_SIZE - 75), window.innerWidth - 170),
            top: Math.min(Math.max(0, this.state.selected_pixel.y * PIXEL_SIZE + 35), window.innerHeight - 216),
          }}>
            <BlockPicker color="RED" onChangeComplete={this.handleColorPicker.bind(this)} />
          </div>
        }
      </div >
    );
  }
}

export default App;
