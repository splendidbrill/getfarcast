import { ImageResponse } from "next/og";

export const alt = "GetFarcast homepage preview";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

const brand = "#ff6b4e";
const brandSoft = "#fff1eb";
const ink = "#1a1a2e";
const muted = "#6b7280";
const line = "#ece7e3";

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: "linear-gradient(135deg, #fff8f4 0%, #fff3ec 48%, #fdfdfd 100%)",
                    color: ink,
                    fontFamily: "Inter, sans-serif",
                    padding: "42px",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "-80px",
                        left: "-40px",
                        width: "360px",
                        height: "360px",
                        borderRadius: "9999px",
                        background: "rgba(255, 107, 78, 0.12)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: "20px",
                        bottom: "-100px",
                        width: "360px",
                        height: "360px",
                        borderRadius: "9999px",
                        background: "rgba(59, 130, 246, 0.08)",
                    }}
                />

                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        borderRadius: "32px",
                        border: `1px solid ${line}`,
                        background: "rgba(255,255,255,0.9)",
                        padding: "34px",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            width: "46%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            paddingRight: "26px",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "24px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "52px",
                                        height: "52px",
                                        borderRadius: "16px",
                                        background: brand,
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "24px",
                                        fontWeight: 800,
                                    }}
                                >
                                    G
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        fontSize: "18px",
                                        color: muted,
                                    }}
                                >
                                    <span style={{ fontSize: "26px", fontWeight: 800, color: ink }}>
                                        GetFarcast
                                    </span>
                                    <span>AI-powered growth engine</span>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    alignSelf: "flex-start",
                                    padding: "10px 16px",
                                    borderRadius: "9999px",
                                    background: "white",
                                    border: `1px solid ${line}`,
                                    color: brand,
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    marginBottom: "20px",
                                }}
                            >
                                Your always-on AI growth agent
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    fontSize: "64px",
                                    lineHeight: 1.02,
                                    fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                }}
                            >
                                <span>Building is easy.</span>
                                <span style={{ color: brand }}>Distribution isn&apos;t.</span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    marginTop: "22px",
                                    fontSize: "24px",
                                    lineHeight: 1.35,
                                    color: muted,
                                    maxWidth: "500px",
                                }}
                            >
                                Describe your product. GetFarcast finds your ICP, maps channels,
                                drafts content, and surfaces warm leads.
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "14px",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "56px",
                                    padding: "0 24px",
                                    borderRadius: "16px",
                                    background: brand,
                                    color: "white",
                                    fontSize: "20px",
                                    fontWeight: 800,
                                }}
                            >
                                Start Your Growth Engine
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "56px",
                                    padding: "0 24px",
                                    borderRadius: "16px",
                                    background: "white",
                                    border: `1px solid ${line}`,
                                    color: ink,
                                    fontSize: "20px",
                                    fontWeight: 700,
                                }}
                            >
                                See How It Works
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            width: "54%",
                            height: "100%",
                            display: "flex",
                            position: "relative",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: "18px",
                                top: "40px",
                                display: "flex",
                                flexDirection: "column",
                                width: "170px",
                                padding: "18px",
                                borderRadius: "22px",
                                background: "white",
                                border: `1px solid ${line}`,
                            }}
                        >
                            <span style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>
                                Found ICP
                            </span>
                            <div style={{ height: "10px", borderRadius: "9999px", background: line, marginBottom: "8px" }} />
                            <div style={{ height: "10px", width: "78%", borderRadius: "9999px", background: "#dbeafe" }} />
                        </div>

                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: "28px",
                                overflow: "hidden",
                                border: `1px solid ${line}`,
                                background: "white",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    height: "56px",
                                    padding: "0 18px",
                                    background: "#fafafa",
                                    borderBottom: `1px solid ${line}`,
                                }}
                            >
                                <div style={{ display: "flex", gap: "8px", marginRight: "18px" }}>
                                    <div style={{ width: "12px", height: "12px", borderRadius: "9999px", background: "#f87171" }} />
                                    <div style={{ width: "12px", height: "12px", borderRadius: "9999px", background: "#fbbf24" }} />
                                    <div style={{ width: "12px", height: "12px", borderRadius: "9999px", background: "#4ade80" }} />
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flex: 1,
                                        height: "34px",
                                        borderRadius: "10px",
                                        border: `1px solid ${line}`,
                                        background: "white",
                                        color: muted,
                                        fontSize: "16px",
                                        fontWeight: 700,
                                    }}
                                >
                                    app.getfarcast.com/playbook
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                    padding: "20px",
                                    background: "white",
                                }}
                            >
                                {[
                                    { title: "Your Market", accent: "#dbeafe" },
                                    { title: "Channels", accent: "#ede9fe" },
                                    { title: "Content Output", accent: brandSoft },
                                    { title: "Warm Leads", accent: "#fef3c7" },
                                ].map((card) => (
                                    <div
                                        key={card.title}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            width: "calc(50% - 8px)",
                                            padding: "18px",
                                            borderRadius: "20px",
                                            background: "#fafafa",
                                            border: `1px solid ${line}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                marginBottom: "14px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "12px",
                                                    background: card.accent,
                                                    display: "flex",
                                                }}
                                            />
                                            <span style={{ fontSize: "18px", fontWeight: 800 }}>{card.title}</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <div style={{ height: "10px", borderRadius: "9999px", background: line }} />
                                            <div style={{ height: "10px", width: "82%", borderRadius: "9999px", background: line }} />
                                            <div style={{ height: "10px", width: "58%", borderRadius: "9999px", background: card.accent }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            style={{
                                position: "absolute",
                                right: "12px",
                                bottom: "28px",
                                display: "flex",
                                flexDirection: "column",
                                width: "200px",
                                padding: "18px",
                                borderRadius: "22px",
                                background: "white",
                                border: `1px solid ${line}`,
                            }}
                        >
                            <span style={{ fontSize: "18px", fontWeight: 800, marginBottom: "10px" }}>
                                Warm leads
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "14px",
                                    color: muted,
                                    marginBottom: "8px",
                                }}
                            >
                                <span>Founder</span>
                                <span style={{ color: brand, fontWeight: 700 }}>Active</span>
                            </div>
                            <div style={{ height: "10px", borderRadius: "9999px", background: "#fde7df" }}>
                                <div
                                    style={{
                                        width: "84%",
                                        height: "100%",
                                        borderRadius: "9999px",
                                        background: brand,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        size,
    );
}