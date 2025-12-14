import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from './App';
import React from 'react';

// Mock scrollIntoView since jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('App Import/Export', () => {
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        // Mock URL.createObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:test');
        global.URL.revokeObjectURL = vi.fn();
        // Mock alert and confirm
        window.alert = vi.fn();
        window.confirm = vi.fn(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('exports data correctly', async () => {
        render(<App />);

        // Open sidebar (assuming mobile approach or just finding the button if visible)
        // The sidebar is visible on desktop by default? 
        // In App.tsx: 
        // md:relative md:translate-x-0 md:block -> visible on desktop
        // We can just query for the Export button.

        // Wait for buttons to be available
        const exportBtn = await screen.findByText('Export');

        // Spy on link click
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

        fireEvent.click(exportBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('imports data correctly', async () => {
        render(<App />);

        const importBtn = await screen.findByText('Import');
        expect(importBtn).toBeDefined();

        // Find the hidden file input. 
        // The label or button triggers input click, but for testing we can fire change on the input directly.
        // In MemoryPanel, the input has type="file" and style display:none (className="hidden")
        // We can select it by label if it had one, or by selector.
        // Since it's hidden, we might need to use container query.

        // Let's rely on the fact it's an input of type file.
        // However, it's inside MemoryPanel.

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeTruthy();

        const mockData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            memories: [{ id: '1', text: 'Test Memory', category: 'fact', timestamp: new Date() }],
            messages: []
        };

        const file = new File([JSON.stringify(mockData)], 'backup.json', { type: 'application/json' });

        // Mock FileReader logic since jsdom FileReader might not trigger onload automatically with just fireEvent
        // Actually jsdom supports FileReader.

        fireEvent.change(fileInput, { target: { files: [file] } });

        // Wait for the confirm dialog
        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
        });

        // After confirm (which returns true in mock), memories should be updated.
        // We can check if "Test Memory" appears on screen.
        await waitFor(() => {
            expect(screen.getByText(/Test Memory/)).toBeDefined();
        });
    });
});
