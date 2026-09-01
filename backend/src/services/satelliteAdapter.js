/**
 * SatelliteAdapter — provider-independent interface (Shagun's subsystem).
 *
 * This lets the rest of the system (sync engine, API routes) talk to "the
 * satellite" without knowing whether it's a hackathon mock or a real future
 * ground-station / LEO-constellation provider.
 *
 * IMPORTANT (feasibility rule from the team plan): this hackathon build does
 * NOT talk to a real satellite. MockSatelliteAdapter simulates the gateway
 * with timed promises so the sync UX (SYNCING → SYNCED / SYNC ERROR) is real
 * and demoable. RealSatelliteAdapter is a typed boundary only — it throws,
 * so it can never be mistaken for a live integration.
 */

class SatelliteAdapter {
  async connect() { throw new Error("Not implemented"); }
  async disconnect() { throw new Error("Not implemented"); }
  async getStatus() { throw new Error("Not implemented"); }
  async uploadPackage(_pkg) { throw new Error("Not implemented"); }
  async downloadPackage(_pkg) { throw new Error("Not implemented"); }
  async getAvailablePackages() { throw new Error("Not implemented"); }
  async getSatelliteData(_query) { throw new Error("Not implemented"); }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockSatelliteAdapter extends SatelliteAdapter {
  constructor({ latencyMs = 900, onLog } = {}) {
    super();
    this.latencyMs = latencyMs;
    this.connected = false;
    this.onLog = onLog || (() => {});
  }

  async connect() {
    this.onLog("Mock Satellite Gateway: establishing pass window…");
    await wait(this.latencyMs);
    this.connected = true;
    this.onLog("Mock Satellite Gateway: link established (simulated).");
    return { connected: true, provider: "MockSatelliteAdapter (hackathon MVP)" };
  }

  async disconnect() {
    this.connected = false;
    this.onLog("Mock Satellite Gateway: link closed.");
    return { connected: false };
  }

  async getStatus() {
    return { connected: this.connected, provider: "MockSatelliteAdapter" };
  }

  async getAvailablePackages(catalog) {
    await wait(this.latencyMs / 2);
    return catalog;
  }

  async downloadPackage(pkg, { simulateFailure = false } = {}) {
    await wait(this.latencyMs + pkg.size_mb * 4);
    if (simulateFailure) {
      throw new Error(`Package validation failed for ${pkg.name} (checksum mismatch — simulated)`);
    }
    return { ok: true, packageId: pkg.id, downloadedAt: Date.now() };
  }

  async uploadPackage(pkg, { simulateFailure = false } = {}) {
    await wait(this.latencyMs + (pkg.size_mb || 0.2) * 4);
    if (simulateFailure) {
      throw new Error(`Upload rejected for ${pkg.name || pkg.id} (simulated link drop)`);
    }
    return { ok: true, packageId: pkg.id, uploadedAt: Date.now() };
  }

  async getSatelliteData(query) {
    await wait(this.latencyMs);
    return { query, cached: true, source: "cached Earth-observation demo dataset" };
  }
}

/**
 * RealSatelliteAdapter — future integration boundary only.
 * Intentionally not connected to any hardware or provider API. Swap this in
 * behind the same SatelliteAdapter interface once a real provider is chosen;
 * no other code in the app needs to change.
 */
class RealSatelliteAdapter extends SatelliteAdapter {
  async connect() {
    throw new Error(
      "RealSatelliteAdapter is not implemented in this hackathon build. " +
      "It exists only as a typed boundary for a future real satellite/provider integration."
    );
  }
}

module.exports = { SatelliteAdapter, MockSatelliteAdapter, RealSatelliteAdapter };
