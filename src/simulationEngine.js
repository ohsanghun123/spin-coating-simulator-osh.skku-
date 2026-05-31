export function runSpinCoatingSimulation(rpm, h0_um, eta0, E_um_s, alpha) {
    const rho = 1000; 
    const omega = rpm * (2 * Math.PI / 60); 
    const h0 = h0_um * 1e-6; 
    const E = E_um_s * 1e-6; 
    const dt = 0.01; 
    let t = 0; let h = h0; let eta = eta0;
    const results = [];
    const dhdt = (current_h, current_eta) => {
        return -(2 * rho * Math.pow(omega, 2) * Math.pow(current_h, 3)) / (3 * current_eta) - E;
    };
    while (eta < 10 && h > 0.1e-6 && t < 150) {
        results.push({ time: parseFloat(t.toFixed(2)), thickness: h * 1e6, viscosity: eta });
        let k1 = dhdt(h, eta);
        let h_k2 = h + 0.5 * dt * k1;
        let eta_k2 = eta0 * Math.pow((h0 - E * (t + 0.5 * dt)) / h_k2, alpha);
        let k2 = dhdt(h_k2, eta_k2);
        let h_k3 = h + 0.5 * dt * k2;
        let eta_k3 = eta0 * Math.pow((h0 - E * (t + 0.5 * dt)) / h_k3, alpha);
        let k3 = dhdt(h_k3, eta_k3);
        let h_k4 = h + dt * k3;
        let eta_k4 = eta0 * Math.pow((h0 - E * (t + dt)) / h_k4, alpha);
        let k4 = dhdt(h_k4, eta_k4);
        h = h + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        t = t + dt;
        let remaining_solvent = h0 - (E * t);
        if (remaining_solvent <= 0) break;
        eta = eta0 * Math.pow(remaining_solvent / h, alpha);
    }
    return results;
}