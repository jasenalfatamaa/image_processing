import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageProcessor from './ImageProcessor';

// Mock WebSockets
class MockWebSocket {
    constructor(url) {
        this.url = url;
        setTimeout(() => { if (this.onopen) this.onopen(); }, 0);
    }
    send(data) { }
    close() { }
}
global.WebSocket = MockWebSocket;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

// Mock fetch
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ history: [] }),
    })
);

// Mock react-compare-slider
vi.mock('react-compare-slider', () => ({
    ReactCompareSlider: ({ itemOne, itemTwo }) => <div data-testid="compare-slider">{itemOne}{itemTwo}</div>,
    ReactCompareSliderImage: ({ src, alt }) => <img src={src} alt={alt} />
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Upload: () => <div data-testid="icon-upload" />,
    Image: () => <div data-testid="icon-image" />,
    Settings: () => <div data-testid="icon-settings" />,
    Zap: () => <div data-testid="icon-zap" />,
    CheckCircle: () => <div data-testid="icon-check" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    Download: () => <div data-testid="icon-download" />,
    RefreshCcw: () => <div data-testid="icon-refresh" />,
    Layers: () => <div data-testid="icon-layers" />,
    Maximize2: () => <div data-testid="icon-maximize" />,
    ChevronRight: () => <div data-testid="icon-chevron" />,
}));

describe('ImageProcessor Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the brand title', () => {
        render(<ImageProcessor />);
        expect(screen.getByText(/NEO/i)).toBeInTheDocument();
    });

    it('initially has the Transform button disabled', () => {
        render(<ImageProcessor />);
        const button = screen.getByRole('button', { name: /TRANSFORM JOB/i });
        expect(button).toBeDisabled();
    });

    it('toggles Monochrome option', () => {
        render(<ImageProcessor />);
        const toggle = screen.getByText(/Monochrome/i);
        fireEvent.click(toggle);
        const toggleContainer = toggle.closest('.group');
        expect(toggleContainer).toHaveClass('bg-purple-500/10');
    });

    it('enters Demo Mode when backend is offline', async () => {
        // Mock fetch to fail for this specific test
        global.fetch.mockImplementationOnce(() => Promise.reject(new Error("Offline")));

        render(<ImageProcessor />);

        // Check if Demo Mode badge appears with the restored text
        const badge = await screen.findByText(/Demo Mode Proxy Active/i);
        expect(badge).toBeInTheDocument();
    });
});
