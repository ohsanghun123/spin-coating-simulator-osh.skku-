import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { runRK4Simulation } from './simulationEngine';

export default function SpinCoatingSimulator() {
    const [rpm, setRpm] = useState(3000);
    const [h0, setH0] = useState(20);
    const [eta0, setEta0] = useState(0.02);
    const [evapRate, setEvapRate] = useState(0.5);
    const [useRaoult, setUseRaoult] = useState(false);
    
    const [plotData, setPlotData] = useState([]);
    const [metrics, setMetrics] = useState({ finalH: 0, gelTime: 0, minH: 0 });

    useEffect(() => {
        const res = runRK4Simulation(rpm, h0, eta0, evapRate, useRaoult);
        setPlotData(res);
        
        if (res.length > 0) {
            const h_poly = h0 * 0.20; 
            const finalState = res[res.length - 1];
            
            // 물리적으로 완벽한 겔화 지표 판단
            const gelPoint = res.find(d => d.viscosity >= 9.99 || (useRaoult && d.thickness_RK4 <= h_poly + 0.01));
            
            setMetrics({
                finalH: finalState.thickness_RK4.toFixed(2),
                gelTime: gelPoint ? gelPoint.time.toFixed(2) : `> ${useRaoult ? '100.0' : '30.0'}`,
                minH: h_poly.toFixed(2)
            });
        }
    }, [rpm, h0, eta0, evapRate, useRaoult]);

    const colors = {
        bg: '#f8fafc',
        card: '#ffffff',
        textMain: '#0f172a',
        textSub: '#64748b',
        primary: '#4f46e5',
        secondary: '#0ea5e9',
        accent: '#f59e0b',
        border: '#e2e8f0'
    };

    return (
        <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '40px 5%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ color: colors.textMain, fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>
                    Spin Coating Multiphysics Simulator
                </h1>
                <p style={{ color: colors.textSub, margin: 0, fontSize: '15px' }}>
                    Coupled Hydrodynamics and Mass Transfer Kinetics
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '13px', fontWeight: '600' }}>FINAL THICKNESS</div>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: colors.primary, fontSize: '32px', fontWeight: '800' }}>{metrics.finalH}</span>
                                <span style={{ color: colors.textSub, fontSize: '16px', fontWeight: '500' }}>μm</span>
                            </div>
                        </div>
                        <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '13px', fontWeight: '600' }}>GELATION TIME</div>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: colors.secondary, fontSize: '32px', fontWeight: '800' }}>{metrics.gelTime}</span>
                                <span style={{ color: colors.textSub, fontSize: '16px', fontWeight: '500' }}>s</span>
                            </div>
                        </div>
                        <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '13px', fontWeight: '600' }}>THEORETICAL LIMIT</div>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: colors.accent, fontSize: '32px', fontWeight: '800' }}>{useRaoult ? metrics.minH : 'N/A'}</span>
                                <span style={{ color: colors.textSub, fontSize: '16px', fontWeight: '500' }}>μm</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                        <h3 style={{ color: colors.textMain, fontSize: '16px', marginTop: 0, marginBottom: '20px' }}>Transient Film Profile & Validation View</h3>
                        <div style={{ width: '100%', height: '420px' }}>
                            <ResponsiveContainer>
                                <LineChart data={plotData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                                    <XAxis dataKey="time" stroke={colors.textSub} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke={colors.textSub} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke={colors.textSub} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${colors.border}` }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', color: colors.textSub }} />
                                    
                                    <Line yAxisId="left" type="monotone" dataKey="thickness_RK4" name="Thickness (Numerical)" stroke={colors.primary} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="thickness_EBP" name="EBP Limit (Analytical)" stroke={colors.accent} strokeWidth={2} strokeDasharray="6 6" dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="viscosity" name="Viscosity" stroke={colors.secondary} strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h3 style={{ color: colors.textMain, fontSize: '16px', margin: 0 }}>Process Parameters</h3>
                    
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Rotation Speed</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{rpm} RPM</span>
                        </div>
                        <input type="range" min="1000" max="5000" step="500" value={rpm} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setRpm(Number(e.target.value))} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Initial Thickness</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{h0} μm</span>
                        </div>
                        <input type="range" min="10" max="50" step="5" value={h0} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setH0(Number(e.target.value))} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Initial Viscosity</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{eta0} Pa·s</span>
                        </div>
                        <input type="range" min="0.01" max="0.10" step="0.01" value={eta0} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setEta0(Number(e.target.value))} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Evaporation Rate</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{evapRate.toFixed(1)} μm/s</span>
                        </div>
                        <input type="range" min="0.0" max="2.0" step="0.1" value={evapRate} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setEvapRate(Number(e.target.value))} />
                    </div>

                    <hr style={{ border: 0, borderTop: `1px solid ${colors.border}`, margin: '8px 0' }} />

                    {/* 지적사항 3: Raoult's Law 동적 증발 토글 부활 */}
                    <div style={{ backgroundColor: colors.bg, padding: '16px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '12px' }}>
                            <input type="checkbox" checked={useRaoult} onChange={(e) => setUseRaoult(e.target.checked)} style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: colors.primary }} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: colors.textMain, marginBottom: '4px' }}>Raoult's Law Integration</div>
                                <div style={{ fontSize: '12px', color: colors.textSub, lineHeight: '1.4' }}>Dynamically couples solvent vapor pressure decay with mass transfer kinetics.</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
