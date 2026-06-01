import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { runRK4Simulation } from './simulationEngine';

export default function SpinCoatingSimulator() {
    const [rpm, setRpm] = useState(3000);
    const [h0, setH0] = useState(20);
    const [eta0, setEta0] = useState(0.02); // 💡 추가된 초기 점도 상태
    const [evapRate, setEvapRate] = useState(0.5);
    const [useRaoult, setUseRaoult] = useState(false);
    const [edgeSuppress, setEdgeSuppress] = useState(0.5); // 💡 [추가 ①] 엣지 용매증기 억제 (0=무제어, 1=완전제어)

    // 탭 UI 상태 관리
    const [viewMode, setViewMode] = useState('temporal'); 
    
    const [plotData, setPlotData] = useState({ timeData: [], spatialData: [], uniformity: 0 });
    const [metrics, setMetrics] = useState({ finalH: 0, gelTime: 0, minH: 0 });

    useEffect(() => {
        // 💡 [추가 ②] edgeSuppress를 6번째 인자로 전달
        const res = runRK4Simulation(rpm, h0, eta0, evapRate, useRaoult, edgeSuppress);
        setPlotData(res);
        
        if (res.timeData.length > 0) {
            const h_poly = h0 * 0.20; 
            const finalState = res.timeData[res.timeData.length - 1];
            const gelPoint = res.timeData.find(d => d.viscosity >= 9.99 || (useRaoult && d.thickness_RK4 <= h_poly + 0.01));
            
            setMetrics({
                finalH: finalState.thickness_RK4.toFixed(2),
                gelTime: gelPoint ? gelPoint.time.toFixed(2) : `> ${useRaoult ? '200.0' : '300.0'}`,
                minH: h_poly.toFixed(2)
            });
        }
    }, [rpm, h0, eta0, evapRate, useRaoult, edgeSuppress]); // 💡 [추가 ③] 의존성 배열에 edgeSuppress 포함

    const colors = {
        bg: '#f8fafc', card: '#ffffff', textMain: '#0f172a', textSub: '#64748b',
        primary: '#4f46e5', secondary: '#0ea5e9', accent: '#f59e0b', error: '#ef4444', success: '#10b981', border: '#e2e8f0'
    };

    // 균일도 조건에 따른 색상 시각화 (+- 2% 이내면 초록색)
    const isUniform = plotData.uniformity <= 2.0;

    return (
        <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '40px 5%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ color: colors.textMain, fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>
                    Spin Coating Multiphysics Simulator
                </h1>
                <p style={{ color: colors.textSub, margin: 0, fontSize: '15px' }}>
                    Coupled Hydrodynamics, Mass Transfer Kinetics & Spatial Uniformity
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* 상단 4개 Metrics 패널 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '12px', fontWeight: '600' }}>CENTER THICKNESS</div>
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: colors.primary, fontSize: '28px', fontWeight: '800' }}>{metrics.finalH}</span>
                                <span style={{ color: colors.textSub, fontSize: '14px', fontWeight: '500' }}>μm</span>
                            </div>
                        </div>
                        <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '12px', fontWeight: '600' }}>GELATION TIME</div>
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: colors.secondary, fontSize: '28px', fontWeight: '800' }}>{metrics.gelTime}</span>
                                <span style={{ color: colors.textSub, fontSize: '14px', fontWeight: '500' }}>s</span>
                            </div>
                        </div>
                        <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '12px', fontWeight: '600' }}>RADIAL UNIFORMITY</div>
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: isUniform ? colors.success : colors.error, fontSize: '28px', fontWeight: '800' }}>±{plotData.uniformity}</span>
                                <span style={{ color: colors.textSub, fontSize: '14px', fontWeight: '500' }}>%</span>
                            </div>
                        </div>
                        <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                            <div style={{ color: colors.textSub, fontSize: '12px', fontWeight: '600' }}>THEORETICAL LIMIT</div>
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ color: colors.accent, fontSize: '28px', fontWeight: '800' }}>{useRaoult ? metrics.minH : 'N/A'}</span>
                                <span style={{ color: colors.textSub, fontSize: '14px', fontWeight: '500' }}>μm</span>
                            </div>
                        </div>
                    </div>

                    {/* 도메인 전환 탭 UI 및 차트 영역 */}
                    <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: `2px solid ${colors.border}`, paddingBottom: '10px' }}>
                            <button onClick={() => setViewMode('temporal')} style={{ padding: '8px 16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none', background: 'transparent', color: viewMode === 'temporal' ? colors.primary : colors.textSub, borderBottom: viewMode === 'temporal' ? `3px solid ${colors.primary}` : 'none' }}>
                                ⏱ Transient Kinetics (h vs t)
                            </button>
                            <button onClick={() => setViewMode('spatial')} style={{ padding: '8px 16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none', background: 'transparent', color: viewMode === 'spatial' ? colors.primary : colors.textSub, borderBottom: viewMode === 'spatial' ? `3px solid ${colors.primary}` : 'none' }}>
                                📏 Spatial Distribution (h vs r)
                            </button>
                        </div>

                        <div style={{ width: '100%', height: '420px' }}>
                            <ResponsiveContainer>
                                {viewMode === 'temporal' ? (
                                    <LineChart data={plotData.timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                                        <XAxis dataKey="time" stroke={colors.textSub} fontSize={12} tickLine={false} />
                                        <YAxis yAxisId="left" stroke={colors.textSub} fontSize={12} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke={colors.textSub} fontSize={12} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${colors.border}` }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        
                                        <Line yAxisId="left" type="monotone" dataKey="thickness_RK4" name="Center Thickness" stroke={colors.primary} strokeWidth={3} dot={false} />
                                        <Line yAxisId="left" type="monotone" dataKey="thickness_EBP" name="EBP Limit" stroke={colors.accent} strokeWidth={2} strokeDasharray="6 6" dot={false} />
                                        <Line yAxisId="right" type="monotone" dataKey="viscosity" name="Viscosity" stroke={colors.secondary} strokeWidth={2} dot={false} />
                                    </LineChart>
                                ) : (
                                    <AreaChart data={plotData.spatialData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorThickness" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                                        <XAxis dataKey="radius" stroke={colors.textSub} fontSize={12} tickLine={false} label={{ value: 'Radius (mm)', position: 'insideBottomRight', offset: -5 }} />
                                        <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} stroke={colors.textSub} fontSize={12} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${colors.border}` }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        
                                        <Area type="monotone" dataKey="thickness" name="Final Film Profile (Radial)" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorThickness)" />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 파라미터 제어 패널 */}
                <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h3 style={{ color: colors.textMain, fontSize: '16px', margin: 0 }}>Challenge Mode Controls</h3>
                    
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Rotation Speed</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{rpm} RPM</span>
                        </div>
                        <input type="range" min="1000" max="5000" step="500" value={rpm} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setRpm(Number(e.target.value))} />
                    </div>

                    {/* 💡 새로 추가된 초기 점도 (Initial Viscosity) 제어 슬라이더 구역 */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Initial Viscosity</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{eta0.toFixed(3)} Pa·s</span>
                        </div>
                        <input type="range" min="0.005" max="0.10" step="0.005" value={eta0} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setEta0(Number(e.target.value))} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Evaporation Rate</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{evapRate.toFixed(1)} μm/s</span>
                        </div>
                        <input type="range" min="0.0" max="2.0" step="0.1" value={evapRate} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setEvapRate(Number(e.target.value))} />
                    </div>

                    {/* 💡 [추가 ④] 엣지 용매증기 억제 (Edge-Vapor Suppression) 제어 슬라이더 */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSub }}>Edge-Vapor Suppression</label>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>{(edgeSuppress * 100).toFixed(0)} %</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={edgeSuppress} style={{ width: '100%', accentColor: colors.primary }} onChange={(e) => setEdgeSuppress(Number(e.target.value))} />
                        <div style={{ fontSize: '11px', color: colors.textSub, marginTop: '6px', lineHeight: '1.4' }}>
                            Localized solvent-exhaust control. 0% = uncontrolled radial gradient, 100% = uniform evaporation front.
                        </div>
                    </div>

                    <hr style={{ border: 0, borderTop: `1px solid ${colors.border}`, margin: '8px 0' }} />

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
