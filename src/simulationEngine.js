// ============================================================================
//  Spin-Coating RK4 Simulator  (drop-in replacement)
//  Changes vs. previous version (marked [FIX] / [NEW]):
//   [FIX] max_time raised so slow-draining points (high eta0 / low rpm)
//         reach gelation instead of being truncated -> removes the spurious
//         non-uniformity spike (e.g. the old 40% artifact).
//   [NEW] edgeSuppress (0..1): localized solvent-vapor / edge-exhaust control.
//         0 = uncontrolled, 1 = fully suppressed edge evaporation gradient.
//         Implements the "localized solvent vapor exhaust control" of Sec. 6.
//   [NEW] gelMode ('threshold' | 'balance'): freezing criterion selector.
//         'threshold' = freeze when viscosity reaches eta_gel (= 10 Pa.s).
//                       Accumulated-mass-loss criterion -> hf rises with omega.
//         'balance'   = freeze when convective drainage drops to the
//                       evaporation rate (classical Meyerhofer transition).
//                       Recovers the textbook scaling hf ~ omega^(-2/3).
//         Default 'threshold' keeps the original behaviour unchanged.
// ============================================================================
export function runRK4Simulation(rpm, h0, eta0, evapRate, useRaoult = false, edgeSuppress = 0, gelMode = 'threshold') {
    const dt = 0.001;
    const rho = 1050; // kg/m^3
    const alpha = 3.0;
    const w = rpm * (2 * Math.PI / 60);
    const E0 = evapRate * 1e-6; // m/s
    const h_poly = (h0 * 1e-6) * 0.20;
    const R_wafer = 0.15; // 150 mm

    // [NEW] edge-vapor suppression scales the peripheral evaporation gradient
    const edge_factor = 0.8 * (rpm / 3000) * (1 - edgeSuppress);

    const simulatePoint = (r_idx, isCenter) => {
        const r_ratio = r_idx / 50;
        const E_local = E0 * (1 + edge_factor * Math.pow(r_ratio, 3));
        const ebp_constant = (4 * rho * Math.pow(w, 2) * Math.pow(h0 * 1e-6, 2)) / (3 * eta0);

        let t = 0;
        let h = h0 * 1e-6;
        let eta = eta0;
        let cumulative_evap = 0;
        let next_log_time = 0;

        const localTimeData = [];
        // [FIX] integrate long enough for every radial point to gel
        const max_time = useRaoult ? 200.0 : 300.0;

        const getRates = (curr_h, curr_eta) => {
            let current_E = E_local;
            if (useRaoult) {
                current_E = curr_h > h_poly ? E_local * ((curr_h - h_poly) / curr_h) : 0;
            }
            const drainage = (2 * rho * Math.pow(w, 2) * Math.pow(curr_h, 3)) / (3 * curr_eta);
            return { dhdt: -drainage - current_E, evap: current_E, drainage };
        };

        while (t <= max_time) {
            if (isCenter && (t >= next_log_time || t === 0)) {
                let h_EBP = (h0 * 1e-6) * Math.pow(1 + ebp_constant * t, -0.5);
                localTimeData.push({
                    time: parseFloat(t.toFixed(2)),
                    thickness_RK4: parseFloat((h * 1e6).toFixed(4)),
                    thickness_EBP: parseFloat((h_EBP * 1e6).toFixed(4)),
                    viscosity: parseFloat(eta.toFixed(4))
                });
                next_log_time += 0.1;
            }

            // [NEW] gelation-criterion selector
            if (gelMode === 'balance') {
                // classical Meyerhofer transition: convective drainage == evaporation rate
                const rNow = getRates(h, eta);
                if ((rNow.evap > 0 && rNow.drainage <= rNow.evap) || h <= 0) break;
            } else {
                // viscosity threshold (original behaviour)
                if (eta >= 10.0 || h <= 0) break;
            }

            let rates1 = getRates(h, eta);
            let k1 = rates1.dhdt;
            let k2 = getRates(h + 0.5 * dt * k1, eta).dhdt;
            let k3 = getRates(h + 0.5 * dt * k2, eta).dhdt;
            let k4 = getRates(h + dt * k3, eta).dhdt;

            h += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
            cumulative_evap += rates1.evap * dt;
            t += dt;

            if (useRaoult) {
                if (h <= h_poly) {
                    h = h_poly;
                    eta = 10.0;
                } else {
                    let h_no_evap = (h0 * 1e-6) - cumulative_evap;
                    if (h_no_evap < h_poly) h_no_evap = h_poly;
                    eta = eta0 * Math.pow(h_no_evap / h, alpha);
                    if (eta > 10.0) eta = 10.0;
                }
            } else {
                if (E_local === 0) {
                    eta = eta0;
                } else {
                    let h_no_evap = (h0 * 1e-6) - (E_local * t);
                    if (h_no_evap <= 0) break;
                    eta = eta0 * Math.pow(h_no_evap / h, alpha);
                    if (eta > 10.0) eta = 10.0;
                }
            }
        }

        if (isCenter) {
            let final_EBP = (h0 * 1e-6) * Math.pow(1 + ebp_constant * t, -0.5);
            localTimeData.push({
                time: parseFloat(t.toFixed(2)),
                thickness_RK4: parseFloat((h * 1e6).toFixed(4)),
                thickness_EBP: parseFloat((final_EBP * 1e6).toFixed(4)),
                viscosity: parseFloat(eta > 10.0 ? 10.0 : eta.toFixed(4))
            });
            return { localTimeData, finalH: h };
        } else {
            return { finalH: h };
        }
    };

    const centerResult = simulatePoint(0, true);
    const timeData = centerResult.localTimeData;
    const spatialData = [];

    let max_h = 0;
    let min_h = Infinity;

    for (let i = 0; i <= 50; i++) {
        let r_mm = i * 3;
        let res = (i === 0) ? centerResult : simulatePoint(i, false);
        let h_um = res.finalH * 1e6;

        spatialData.push({
            radius: r_mm,
            thickness: parseFloat(h_um.toFixed(3))
        });

        if (h_um > max_h) max_h = h_um;
        if (h_um < min_h) min_h = h_um;
    }

    const uniformity = ((max_h - min_h) / (max_h + min_h)) * 100;

    return {
        timeData,
        spatialData,
        uniformity: parseFloat(uniformity.toFixed(2))
    };
}
