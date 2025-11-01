/**
 * Tests for Manual Mode Switcher
 *
 * @see src/manual-mode-switcher.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ManualModeSwitcher,
  DEFAULT_MANUAL_MODE_CONFIG,
} from '../src/manual-mode-switcher';
import { MockMasterProcessingState } from '../src/mode-switcher';

describe('ManualModeSwitcher', () => {
  let processingState: MockMasterProcessingState;
  let switcher: ManualModeSwitcher;

  beforeEach(() => {
    processingState = new MockMasterProcessingState();
    switcher = new ManualModeSwitcher(processingState);
  });

  describe('Initialization', () => {
    it('should start in active_master mode', () => {
      expect(switcher.getCurrentMode()).toBe('active_master');
    });

    it('should start in unlocked state', () => {
      expect(switcher.getLockState()).toBe('unlocked');
    });

    it('should have no locked mode initially', () => {
      expect(switcher.getLockedMode()).toBeNull();
    });
  });

  describe('Manual Mode Switching', () => {
    it('should switch from master to worker mode', async () => {
      processingState.setProcessing(false);

      const requestId = await switcher.requestModeSwitch('idle_worker');
      expect(requestId).toBeNull();
      expect(switcher.getCurrentMode()).toBe('idle_worker');
    });

    it('should switch from worker to master mode', async () => {
      // Start as worker
      processingState.setProcessing(false);
      await switcher.requestModeSwitch('idle_worker');
      expect(switcher.getCurrentMode()).toBe('idle_worker');

      // Switch to master
      const requestId = await switcher.requestModeSwitch('active_master');
      expect(requestId).toBeNull();
      expect(switcher.getCurrentMode()).toBe('active_master');
    });

    it('should switch to standby mode', async () => {
      const requestId = await switcher.requestModeSwitch('standby');
      expect(requestId).toBeNull();
      expect(switcher.getCurrentMode()).toBe('standby');
    });

    it('should prevent switching to worker while master is processing', async () => {
      processingState.setProcessing(true, 'job-123');

      await expect(
        switcher.requestModeSwitch('idle_worker')
      ).rejects.toThrow('Cannot switch to worker mode while master jobs are processing');
    });

    it('should allow switching to worker after processing completes', async () => {
      processingState.setProcessing(true, 'job-123');

      // Cannot switch while processing
      await expect(
        switcher.requestModeSwitch('idle_worker')
      ).rejects.toThrow();

      // Can switch after processing
      processingState.setProcessing(false);
      const requestId = await switcher.requestModeSwitch('idle_worker');
      expect(requestId).toBeNull();
      expect(switcher.getCurrentMode()).toBe('idle_worker');
    });
  });

  describe('Mode Locking (Issue #3 Feature)', () => {
    it('should lock mode to current mode by default', () => {
      switcher.lockMode();

      expect(switcher.getLockState()).toBe('locked');
      expect(switcher.getLockedMode()).toBe('active_master');
    });

    it('should lock mode to specified mode', () => {
      switcher.lockMode('idle_worker');

      expect(switcher.getLockState()).toBe('locked');
      expect(switcher.getLockedMode()).toBe('idle_worker');
    });

    it('should prevent mode switching when locked', async () => {
      switcher.lockMode('active_master');
      processingState.setProcessing(false);

      await expect(switcher.requestModeSwitch('idle_worker')).rejects.toThrow(
        'Mode is locked to active_master'
      );

      expect(switcher.getCurrentMode()).toBe('active_master');
    });

    it('should unlock mode', () => {
      switcher.lockMode('active_master');
      expect(switcher.getLockState()).toBe('locked');

      switcher.unlockMode();
      expect(switcher.getLockState()).toBe('unlocked');
      expect(switcher.getLockedMode()).toBeNull();
    });

    it('should allow switching after unlock', async () => {
      switcher.lockMode('active_master');
      switcher.unlockMode();

      processingState.setProcessing(false);
      const requestId = await switcher.requestModeSwitch('idle_worker');

      expect(requestId).toBeNull();
      expect(switcher.getCurrentMode()).toBe('idle_worker');
    });

    it('should provide lock information', () => {
      switcher.lockMode('active_master');
      const lockInfo = switcher.getLockInfo();

      expect(lockInfo.state).toBe('locked');
      expect(lockInfo.lockedMode).toBe('active_master');
      expect(lockInfo.lockTime).toBeDefined();
      expect(lockInfo.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(lockInfo.isExpired).toBe(false);
    });

    it('should return null lock info when unlocked', () => {
      const lockInfo = switcher.getLockInfo();

      expect(lockInfo.state).toBe('unlocked');
      expect(lockInfo.lockedMode).toBeNull();
      expect(lockInfo.lockTime).toBeNull();
      expect(lockInfo.isExpired).toBe(false);
    });
  });

  describe('Lock Duration Enforcement', () => {
    it('should detect expired lock when max duration exceeded', async () => {
      const config = {
        requireConfirmation: false,
        maxLockDuration: 100, // 100ms
      };
      switcher = new ManualModeSwitcher(processingState, config);

      switcher.lockMode('active_master');
      expect(switcher.isLockExpired()).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(switcher.isLockExpired()).toBe(true);
    });

    it('should enforce max lock duration by unlocking', async () => {
      const config = {
        requireConfirmation: false,
        maxLockDuration: 100, // 100ms
      };
      switcher = new ManualModeSwitcher(processingState, config);

      switcher.lockMode('active_master');
      expect(switcher.getLockState()).toBe('locked');

      await new Promise((resolve) => setTimeout(resolve, 150));

      switcher.enforceMaxLockDuration();
      expect(switcher.getLockState()).toBe('unlocked');
    });

    it('should not expire lock when max duration is 0 (unlimited)', async () => {
      const config = {
        requireConfirmation: false,
        maxLockDuration: 0, // Unlimited
      };
      switcher = new ManualModeSwitcher(processingState, config);

      switcher.lockMode('active_master');

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(switcher.isLockExpired()).toBe(false);
    });
  });

  describe('Confirmation Workflow (FR-2.2.4)', () => {
    it('should require confirmation when configured', async () => {
      const config = {
        requireConfirmation: true,
        maxLockDuration: 0,
      };
      switcher = new ManualModeSwitcher(processingState, config);
      processingState.setProcessing(false);

      const requestId = await switcher.requestModeSwitch('idle_worker');

      expect(requestId).toBeDefined();
      expect(switcher.getCurrentMode()).toBe('active_master'); // Not switched yet
    });

    it('should switch mode after confirmation', async () => {
      const config = {
        requireConfirmation: true,
        maxLockDuration: 0,
      };
      switcher = new ManualModeSwitcher(processingState, config);
      processingState.setProcessing(false);

      const requestId = (await switcher.requestModeSwitch('idle_worker')) as string;
      expect(requestId).toBeDefined();

      await switcher.confirmModeSwitch(requestId);

      expect(switcher.getCurrentMode()).toBe('idle_worker');
    });

    it('should reject confirmation with invalid request ID', async () => {
      const config = {
        requireConfirmation: true,
        maxLockDuration: 0,
      };
      switcher = new ManualModeSwitcher(processingState, config);

      await expect(switcher.confirmModeSwitch('invalid-id')).rejects.toThrow(
        'Invalid or expired request ID'
      );
    });

    it('should allow canceling a pending request', async () => {
      const config = {
        requireConfirmation: true,
        maxLockDuration: 0,
      };
      switcher = new ManualModeSwitcher(processingState, config);
      processingState.setProcessing(false);

      const requestId = (await switcher.requestModeSwitch('idle_worker')) as string;
      switcher.cancelModeSwitch(requestId);

      expect(switcher.getCurrentMode()).toBe('active_master'); // No mode change

      await expect(switcher.confirmModeSwitch(requestId)).rejects.toThrow(
        'Invalid or expired request ID'
      );
    });

    it('should provide information about pending confirmation', async () => {
      const config = {
        requireConfirmation: true,
        maxLockDuration: 0,
      };
      switcher = new ManualModeSwitcher(processingState, config);
      processingState.setProcessing(false);

      const requestId = (await switcher.requestModeSwitch('idle_worker')) as string;

      const pendingInfo = switcher.getPendingConfirmation();
      expect(pendingInfo).toBeDefined();
      expect(pendingInfo!.targetMode).toBe('idle_worker');
      expect(pendingInfo!.requestId).toBe(requestId);
      expect(pendingInfo!.age).toBeGreaterThanOrEqual(0);
    });

    it('should return null for pending confirmation when none exists', () => {
      const pendingInfo = switcher.getPendingConfirmation();
      expect(pendingInfo).toBeNull();
    });
  });

  describe('Mode Change Events', () => {
    it('should notify listeners on mode change', async () => {
      processingState.setProcessing(false);
      const listener = vi.fn();
      switcher.onModeChange(listener);

      await switcher.requestModeSwitch('idle_worker');

      expect(listener).toHaveBeenCalledWith(
        'active_master',
        'idle_worker',
        expect.stringContaining('Manually switched')
      );
    });

    it('should support multiple listeners', async () => {
      processingState.setProcessing(false);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      switcher.onModeChange(listener1);
      switcher.onModeChange(listener2);

      await switcher.requestModeSwitch('idle_worker');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unregistering listeners', async () => {
      processingState.setProcessing(false);
      const listener = vi.fn();

      switcher.onModeChange(listener);
      switcher.offModeChange(listener);

      await switcher.requestModeSwitch('idle_worker');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle lock + confirmation workflow', async () => {
      const config = {
        requireConfirmation: true,
        maxLockDuration: 0,
      };
      switcher = new ManualModeSwitcher(processingState, config);
      processingState.setProcessing(false);

      // Request mode switch
      const requestId = (await switcher.requestModeSwitch('idle_worker')) as string;

      // Lock current mode (should fail - request is pending)
      switcher.lockMode('active_master');

      // Confirm the request
      await switcher.confirmModeSwitch(requestId);

      // Now mode should be switched
      expect(switcher.getCurrentMode()).toBe('idle_worker');

      // And lock should still be active on old mode
      // (Lock was applied to the original mode before switch)
      expect(switcher.getLockState()).toBe('locked');
      expect(switcher.getLockedMode()).toBe('active_master');
    });

    it('should prevent accidental worker mode while processing', async () => {
      processingState.setProcessing(true, 'job-xyz');

      await expect(switcher.requestModeSwitch('idle_worker')).rejects.toThrow(
        'Cannot switch to worker mode'
      );

      expect(switcher.getCurrentMode()).toBe('active_master');
    });
  });

  describe('Default Configuration', () => {
    it('should use default config when not provided', () => {
      expect(DEFAULT_MANUAL_MODE_CONFIG.requireConfirmation).toBe(false);
      expect(DEFAULT_MANUAL_MODE_CONFIG.maxLockDuration).toBe(0);
    });
  });
});
