export function runRK4Simulation(rpm, h0, eta0, evapRate, useRaoult = false) {
    const dt = 0.001;
    const rho = 1050; // 밀도 (kg/m^3)
    const alpha = 3.0; // 점도 상승 지수
    const w = rpm * (2 * Math.PI / 60);
    const E0 = evapRate * 1e-6; // 초기 증발률 (m/s)
    
    // EBP 모델 해석적 해를 위한 상수
    const ebp_constant = (4 * rho * Math.pow(w, 2) * Math.pow(h0 * 1e-6, 2)) / (3 * eta0);
    const h_poly = (h0 * 1e-6) * 0.20; 

    let t = 0;
    let h = h0 * 1e-6;
    let eta = eta0;
    let cumulative_evap = 0;
    const data = [];

    const max_time = useRaoult ? 100.0 : 30.0;
    
    // 부동소수점 오류 해결을 위한 명시적 타임 트래커 도입
    let next_log_time = 0; 

    const getRates = (curr_h, curr_eta) => {
        let current_E = E0;
        if (useRaoult) {
            current_E = curr_h > h_poly ? E0 * ((curr_h - h_poly) / curr_h) : 0;
        }
        const drainage = (2 * rho * Math.pow(w, 2) * Math.pow(curr_h, 3)) / (3 * curr_eta);
        return { dhdt: -drainage - current_E, evap: current_E };
    };

    while (t <= max_time) {
        // [수정됨] 소수점 모듈러(%) 연산을 버리고, 정확히 0.1초 구간마다 강제 기록
        if (t >= next_log_time || t === 0) {
            let h_EBP = (h0 * 1e-6) * Math.pow(1 + ebp_constant * t, -0.5);
            data.push({
                time: parseFloat(t.toFixed(2)),
                thickness_RK4: parseFloat((h * 1e6).toFixed(4)),
                thickness_EBP: parseFloat((h_EBP * 1e6).toFixed(4)), 
                viscosity: parseFloat(eta.toFixed(4))
            });
            next_log_time += 0.1; // 다음 기록 시간 명확히 지정
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
            if (E0 === 0) {
                eta = eta0; 
            } else {
                let h_no_evap = (h0 * 1e-6) - (E0 * t);
                if (h_no_evap <= 0) break;
                eta = eta0 * Math.pow(h_no_evap / h, alpha);
                if (eta > 10.0) eta = 10.0;
            }
        }
    }

    let final_EBP = (h0 * 1e-6) * Math.pow(1 + ebp_constant * t, -0.5);
    data.push({
        time: parseFloat(t.toFixed(2)),
        thickness_RK4: parseFloat((h * 1e6).toFixed(4)),
        thickness_EBP: parseFloat((final_EBP * 1e6).toFixed(4)),
        viscosity: parseFloat(eta > 10.0 ? 10.0 : eta.toFixed(4))
    });

    return data;
}
