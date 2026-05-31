export function runRK4Simulation(rpm, h0, eta0, evapRate, useRaoult = false) {
    const dt = 0.001;
    const rho = 1050; // 밀도 (kg/m^3)
    const alpha = 3.0; // 점도 상승 지수
    const w = rpm * (2 * Math.PI / 60);
    const E0 = evapRate * 1e-6; // 초기 증발률 (m/s)
    
    // EBP 모델 해석적 해를 위한 상수
    const ebp_constant = (4 * rho * Math.pow(w, 2) * Math.pow(h0 * 1e-6, 2)) / (3 * eta0);
    
    // 비휘발성 고분자 체적 (초기 두께의 20%로 설정)
    const h_poly = (h0 * 1e-6) * 0.20; 

    let t = 0;
    let h = h0 * 1e-6;
    let eta = eta0;
    let cumulative_evap = 0;
    const data = [];

    // Raoult 모드는 점근선 수렴을 위해 100초까지, 일반 모드는 30초까지 연산
    const max_time = useRaoult ? 100.0 : 30.0;

    const getRates = (curr_h, curr_eta) => {
        let current_E = E0;
        
        // 지적사항 3: Raoult's Law 적용 (동적 증발률)
        if (useRaoult) {
            current_E = curr_h > h_poly ? E0 * ((curr_h - h_poly) / curr_h) : 0;
        }
        
        const drainage = (2 * rho * Math.pow(w, 2) * Math.pow(curr_h, 3)) / (3 * curr_eta);
        return { dhdt: -drainage - current_E, evap: current_E };
    };

    while (t <= max_time) {
        // 0.1초마다 차트 데이터 저장
        if (Math.abs(t % 0.1) < dt / 2) {
            // 지적사항 1: EBP 해석적 해(Analytical Solution) 동기화
            let h_EBP = (h0 * 1e-6) * Math.pow(1 + ebp_constant * t, -0.5);
            data.push({
                time: parseFloat(t.toFixed(2)),
                thickness_RK4: parseFloat((h * 1e6).toFixed(4)),
                thickness_EBP: parseFloat((h_EBP * 1e6).toFixed(4)), // 검증 뷰 데이터
                viscosity: parseFloat(eta.toFixed(4))
            });
        }

        // 겔화 임계점 도달 시 연산 종료
        if (eta >= 10.0 || h <= 0) break;

        // 4차 룽게-쿠타(RK4) 수치 적분
        let rates1 = getRates(h, eta);
        let k1 = rates1.dhdt;
        let k2 = getRates(h + 0.5 * dt * k1, eta).dhdt;
        let k3 = getRates(h + 0.5 * dt * k2, eta).dhdt;
        let k4 = getRates(h + dt * k3, eta).dhdt;

        h += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        cumulative_evap += rates1.evap * dt;
        t += dt;

        // 점도(Viscosity) 갱신 로직
        if (useRaoult) {
            if (h <= h_poly) {
                h = h_poly; // 고분자 체적 한계 방어
                eta = 10.0;
            } else {
                let h_no_evap = (h0 * 1e-6) - cumulative_evap;
                if (h_no_evap < h_poly) h_no_evap = h_poly;
                eta = eta0 * Math.pow(h_no_evap / h, alpha);
                if (eta > 10.0) eta = 10.0;
            }
        } else {
            // 기본 상수 증발 모드
            if (E0 === 0) {
                eta = eta0; // 지적사항 1 극한 조건 방어: 증발이 없으면 점도 상승 안 함
            } else {
                let h_no_evap = (h0 * 1e-6) - (E0 * t);
                if (h_no_evap <= 0) break;
                eta = eta0 * Math.pow(h_no_evap / h, alpha);
                if (eta > 10.0) eta = 10.0;
            }
        }
    }

    // 최종 겔화 도달 시점 데이터 강제 삽입 (UI 버그 방지)
    let final_EBP = (h0 * 1e-6) * Math.pow(1 + ebp_constant * t, -0.5);
    data.push({
        time: parseFloat(t.toFixed(2)),
        thickness_RK4: parseFloat((h * 1e6).toFixed(4)),
        thickness_EBP: parseFloat((final_EBP * 1e6).toFixed(4)),
        viscosity: parseFloat(eta > 10.0 ? 10.0 : eta.toFixed(4))
    });

    return data;
}
