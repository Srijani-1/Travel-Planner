import { useEffect, useState } from 'react';

interface Props {
    city: string;
    lat: number;
    lon: number;
}

interface WeatherData {
    temp: number;
    windspeed: number;
    weathercode: number;
    daily: { date: string; max: number; min: number; code: number }[];
}

const weatherDesc: Record<number, { label: string; icon: string }> = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mainly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Foggy', icon: '🌫️' },
    61: { label: 'Light rain', icon: '🌦️' },
    63: { label: 'Moderate rain', icon: '🌧️' },
    80: { label: 'Rain showers', icon: '🌧️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
};

export default function WeatherWidget({ city, lat, lon }: Props) {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=4`;
        fetch(url)
            .then(r => r.json())
            .then(d => {
                setData({
                    temp: Math.round(d.current_weather.temperature),
                    windspeed: Math.round(d.current_weather.windspeed),
                    weathercode: d.current_weather.weathercode,
                    daily: d.daily.time.slice(0, 4).map((date: string, i: number) => ({
                        date,
                        max: Math.round(d.daily.temperature_2m_max[i]),
                        min: Math.round(d.daily.temperature_2m_min[i]),
                        code: d.daily.weathercode[i],
                    })),
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [lat, lon]);

    if (loading) return (
        <div style={{ background: 'white', borderRadius: 14, padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Loading weather...
        </div>
    );

    if (!data) return null;

    const current = weatherDesc[data.weathercode] || { label: 'Unknown', icon: '🌡️' };

    return (
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 14, padding: 20, color: 'white' }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{city}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 36 }}>{current.icon}</span>
                <div>
                    <div style={{ fontSize: 36, fontWeight: 700 }}>{data.temp}°C</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{current.label} · Wind {data.windspeed} km/h</div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12 }}>
                {data.daily.map(day => (
                    <div key={day.date} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                            {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: 16 }}>{(weatherDesc[day.code] || { icon: '🌡️' }).icon}</div>
                        <div style={{ fontSize: 11, marginTop: 2 }}>{day.max}° / {day.min}°</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
