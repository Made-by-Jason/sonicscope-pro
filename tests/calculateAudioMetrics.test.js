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

// Execute the script to define functions in the global scope
eval(mainScript);

describe('calculateAudioMetrics', () => {
    let timeDomainData, frequencyData, leftData, rightData;

    beforeEach(() => {
        // Create mock data for the audio metrics calculation
        const bufferSize = 2048;
        timeDomainData = new Uint8Array(bufferSize).fill(128);
        frequencyData = new Uint8Array(1024).fill(0);
        leftData = new Uint8Array(bufferSize).fill(128);
        rightData = new Uint8Array(bufferSize).fill(128);

        // Mock the midSideProcessor
        global.midSideProcessor = {
            mid: new Float32Array(1024).fill(0),
            side: new Float32Array(1024).fill(0),
        };
        global.midSideBalance = { value: 0.5 };
    });

    test('should return zero for silent audio', () => {
        const metrics = calculateAudioMetrics(timeDomainData, frequencyData, leftData, rightData);
        expect(metrics.peakL).toBe(0);
        expect(metrics.peakR).toBe(0);
        expect(metrics.rms).toBe(0);
        expect(metrics.lufs).toBe(0);
        expect(metrics.correlation).toBe(0);
    });

    test('should calculate peak levels correctly', () => {
        leftData[0] = 255; // Max positive amplitude
        rightData[0] = 0;   // Max negative amplitude
        const metrics = calculateAudioMetrics(timeDomainData, frequencyData, leftData, rightData);
        expect(metrics.peakL).toBeCloseTo(1.0, 1);
        expect(metrics.peakR).toBeCloseTo(1.0, 1);
    });

    test('should calculate RMS correctly', () => {
        for (let i = 0; i < leftData.length; i++) {
            leftData[i] = 128 + 64; // ~0.5 amplitude
            rightData[i] = 128 - 64; // ~0.5 amplitude
        }
        const metrics = calculateAudioMetrics(timeDomainData, frequencyData, leftData, rightData);
        expect(metrics.rms).toBeCloseTo(0.5, 1);
    });

    test('should calculate correlation correctly', () => {
        // Perfectly correlated signal
        for (let i = 0; i < leftData.length; i++) {
            leftData[i] = 128 + 64;
            rightData[i] = 128 + 64;
        }
        let metrics = calculateAudioMetrics(timeDomainData, frequencyData, leftData, rightData);
        expect(metrics.correlation).toBeCloseTo(1.0, 1);

        // Perfectly anti-correlated signal
        for (let i = 0; i < leftData.length; i++) {
            leftData[i] = 128 + 64;
            rightData[i] = 128 - 64;
        }
        metrics = calculateAudioMetrics(timeDomainData, frequencyData, leftData, rightData);
        expect(metrics.correlation).toBeCloseTo(-1.0, 1);
    });
});
