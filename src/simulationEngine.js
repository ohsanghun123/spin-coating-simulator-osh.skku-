export function runRK4Simulation(rpm, h0, eta0, evapRate, useRaoult = false) {
    const dt = 0.001;
    const rho = 1050; // kg/m^3
    const alpha = 3.0;
    const w = rpm * (2 * Math.PI / 60);
    const E0 = evapRate * 1e-6; // m/s
    const h_poly = (h0 * 1e-6) * 0.20; 
    const R_wafer = 0.15; // 150 mm

    // 가장자리 증발 가속 계수 (RPM이 높을수록 강한 기류 형성)
    const edge_factor = 0.8 * (rpm / 3000); 

    // 특정 반경(r)에서의 1D RK4 적분을 수행하는 클로저 함수
    const simulatePoint = (r_idx, isCenter) => {
        const r_ratio = r_idx / 50;
        // 반경에 따른 국부 증발률 함수 E(r) 적용
        const E_local = E0 * (1 + edge_factor * Math.pow(r_ratio, 3));
        const ebp_constant = (4 * rho * Math.pow(w, 2) * Math.pow(h0 * 1e-6, 2)) / (3 * eta0);

        let t = 0;
        let h = h0 * 1e-6;
        let eta = eta0;
        let cumulative_evap = 0;
        let next_log_time = 0;
        
        const localTimeData = [];
        const max_time = useRaoult ? 100.0 : 30.0;

        const getRates = (curr_h, curr_eta) => {
            let current_E = E_local;
            if (useRaoult) {
                current_E = curr_h > h_poly ? E_local * ((curr_h - h_poly) / curr_h) : 0;
            }
            const drainage = (2 * rho * Math.pow(w, 2) * Math.pow(curr_h, 3)) / (3 * curr_eta);
            return { dhdt: -drainage - current_E, evap: current_E };
        };

        while (t <= max_time) {
            // 중심부(r=0) 데이터만 시간 도메인 플롯용으로 저장
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

            if (eta >= 10.0 || h <= 0) break;

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

    // 중심부 연산 (시간 도메인 데이터 추출)
    const centerResult = simulatePoint(0, true);
    const timeData = centerResult.localTimeData;
    const spatialData = [];

    let max_h = 0;
    let min_h = Infinity;

    // 반경 0 ~ 150mm 공간 도메인 연산 (Edge Bead 형태 추출)
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

    // 균일도 수식: (최대 두께 - 최소 두께) / (최대 두께 + 최소 두께) * 100
    const uniformity = ((max_h - min_h) / (max_h + min_h)) * 100;

    return {
        timeData,
        spatialData,
        uniformity: parseFloat(uniformity.toFixed(2))
    };
}
