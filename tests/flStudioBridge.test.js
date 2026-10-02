const fs = require('fs');
const path = require('path');

const mainScript = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf-8');

// Mock the DOM and other browser-specific APIs
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.alert = () => {};
global.requestAnimationFrame = () => {};

// Execute the script to define flStudioBridge in the global scope
eval(mainScript);

describe('flStudioBridge', () => {
    beforeEach(() => {
        // Reset the bridge before each test
        flStudioBridge.disconnect();
    });

    test('should not be connected initially', () => {
        expect(flStudioBridge.isConnected).toBe(false);
        expect(flStudioBridge.channelData).toBeNull();
        expect(flStudioBridge.masterData).toBeNull();
    });

    test('should connect successfully', () => {
        expect(flStudioBridge.connect()).toBe(true);
        expect(flStudioBridge.isConnected).toBe(true);
        expect(flStudioBridge.channelData).not.toBeNull();
        expect(flStudioBridge.masterData).not.toBeNull();
    });

    test('should disconnect successfully', () => {
        flStudioBridge.connect();
        expect(flStudioBridge.disconnect()).toBe(true);
        expect(flStudioBridge.isConnected).toBe(false);
        expect(flStudioBridge.channelData).toBeNull();
        expect(flStudioBridge.masterData).toBeNull();
    });

    test('should get channel data when connected', () => {
        flStudioBridge.connect();
        const channelData = flStudioBridge.getChannelData();
        expect(channelData).toEqual({
            name: "Master",
            volume: 0.8,
            pan: 0,
            peakL: 0,
            peakR: 0,
            rms: 0,
            effects: ["Fruity Limiter", "Maximus", "Parametric EQ 2", "Soundgoodizer"]
        });
    });

    test('should get master data when connected', () => {
        flStudioBridge.connect();
        const masterData = flStudioBridge.getMasterData();
        expect(masterData).toEqual({
            tempo: 128,
            sampleRate: 44100,
            bitDepth: 32,
            playbackState: "stopped",
            projectName: "MyTrack.flp"
        });
    });

    test('should start playback when connected', () => {
        flStudioBridge.connect();
        expect(flStudioBridge.startPlayback()).toBe(true);
        expect(flStudioBridge.getMasterData().playbackState).toBe('playing');
    });

    test('should not start playback when disconnected', () => {
        expect(flStudioBridge.startPlayback()).toBe(false);
    });

    test('should stop playback when connected', () => {
        flStudioBridge.connect();
        flStudioBridge.startPlayback();
        expect(flStudioBridge.stopPlayback()).toBe(true);
        expect(flStudioBridge.getMasterData().playbackState).toBe('stopped');
    });

    test('should not stop playback when disconnected', () => {
        expect(flStudioBridge.stopPlayback()).toBe(false);
    });
});
