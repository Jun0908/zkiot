import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Lock, Zap, Globe, Database, ChevronRight, Languages, Menu, X } from 'lucide-react';


const translations = {
  en: {
    nav: {
      home: "Home",
      solution: "Solution",
      technology: "Technology",
      partners: "Partners",
      contact: "Contact"
    },
    hero: {
      title: "zkIoT",
      subtitle: "Zero-Knowledge IoT Framework",
      description: "Enabling IoT devices to prove compliance without revealing raw sensor data. Unlock trust and data usability while protecting privacy, trade secrets, and operational know-how.",
      cta: "Get Started",
      learn: "Learn More"
    },
    problem: {
      title: "The IoT Privacy Crisis",
      subtitle: "Critical challenges blocking IoT adoption",
      items: [
        {
          stat: "70%",
          text: "of IoT data leaks involve sensitive operational details"
        },
        {
          stat: "$500B",
          text: "projected annual cost of IoT data breaches by 2030"
        },
        {
          stat: "60%",
          text: "of enterprises delay IoT rollouts due to privacy concerns"
        }
      ]
    },
    solution: {
      title: "Our Solution",
      subtitle: "zkIoT bridges physical sensors and blockchain verification",
      features: [
        {
          icon: Shield,
          title: "Zero-Knowledge Proofs",
          description: "Devices prove compliance without revealing raw data logs"
        },
        {
          icon: Lock,
          title: "Secure IoT Layer",
          description: "Hardware-secured IDs and signed data ensure authenticity"
        },
        {
          icon: Key,
          title: "Trusted Communication",
          description: "TLS/MQTT pipelines with ZK proofs flowing on-chain"
        }
      ]
    },
    technology: {
      title: "Advanced Technologies",
      subtitle: "Built on cutting-edge cryptographic and IoT technologies",
      categories: [
        {
          title: "Zero-Knowledge Frameworks",
          items: ["Groth16", "PLONK", "STARK", "Range Proofs", "Threshold Proofs"]
        },
        {
          title: "Cryptographic Primitives",
          items: ["Poseidon Hash", "Merkle Trees", "BLS12-381 Curves", "Hardware Security"]
        },
        {
          title: "IoT & Cloud Integration",
          items: ["M5Stack Devices", "AWS IoT Core", "MQTT Protocol", "Lambda Functions"]
        }
      ]
    },
    future: {
      title: "The Future of IoT",
      subtitle: "Toward autonomous machine-to-machine interactions",
      description: "Verified devices interact through smart contracts, enabling M2M transactions. Smart meters settling energy trades, logistics sensors triggering insurance payouts, EVs paying for charging—all without exposing raw data.",
      features: [
        "Autonomous Device Trust",
        "Machine-to-Machine Transactions",
        "Zero-Knowledge Verification",
        "Privacy-Preserving Commerce"
      ]
    },
    partners: {
      title: "Strategic Partners",
      japanOpenChain: {
        title: "Japan Open Chain Partnership",
        points: [
          "Regulatory compliance for KYC-verified peer transactions",
          "Enterprise-grade reliability and compliance infrastructure",
          "Ethereum compatibility with Japanese business standards"
        ]
      },
      ens: {
        title: "ENS Integration",
        points: [
          "ENS as identity layer for trustworthy IoT devices",
          "Privacy-preserving public goods with ZK + ENS",
          "Global public goods registry for IoT data verification"
        ]
      },
      elizaOS: {
        title: "ElizaOS Agent Integration",
        points: [
          "Agentic orchestration for IoT workflows and ZK verification",
          "Policy-safe, auditable automations across devices and chains",
          "Open-source adapters to connect sensors, LLMs, and on-chain actions"
        ]
      }
    },
    footer: {
      contact: "Contact Us",
      privacy: "Privacy Policy",
      terms: "Terms of Service"
    }
  },
  ja: {
    nav: {
      home: "ホーム",
      solution: "ソリューション",
      technology: "技術",
      partners: "パートナー",
      contact: "お問い合わせ"
    },
    hero: {
      title: "zkIoT",
      subtitle: "ゼロ知識証明IoTフレームワーク",
      description: "IoTデバイスが生データを公開することなく、コンプライアンスを証明できるフレームワーク。プライバシー、企業秘密、運用ノウハウを保護しながら、信頼とデータ活用を実現します。",
      cta: "はじめる",
      learn: "詳細を見る"
    },
    problem: {
      title: "IoTプライバシーの危機",
      subtitle: "IoT普及を阻む重要な課題",
      items: [
        {
          stat: "70%",
          text: "のIoTデータ漏洩に機密運用情報が含まれる"
        },
        {
          stat: "$5000億",
          text: "2030年までのIoTデータ漏洩の年間予想損失"
        },
        {
          stat: "60%",
          text: "の企業がプライバシー懸念でIoT導入を延期"
        }
      ]
    },
    solution: {
      title: "私たちのソリューション",
      subtitle: "zkIoTは物理センサーとブロックチェーン検証を橋渡しします",
      features: [
        {
          icon: Shield,
          title: "ゼロ知識証明",
          description: "生データを公開することなく、デバイスがコンプライアンスを証明"
        },
        {
          icon: Lock,
          title: "セキュアIoTレイヤー",
          description: "ハードウェア保護されたIDと署名データで真正性を確保"
        },
        {
          icon: Key,
          title: "信頼できる通信",
          description: "TLS/MQTTパイプラインでZK証明がオンチェーンに流れる"
        }
      ]
    },
    technology: {
      title: "先進技術",
      subtitle: "最先端の暗号技術とIoT技術で構築",
      categories: [
        {
          title: "ゼロ知識証明フレームワーク",
          items: ["Groth16", "PLONK", "STARK", "範囲証明", "閾値証明"]
        },
        {
          title: "暗号プリミティブ",
          items: ["Poseidonハッシュ", "マークル木", "BLS12-381曲線", "ハードウェアセキュリティ"]
        },
        {
          title: "IoT・クラウド統合",
          items: ["M5Stackデバイス", "AWS IoT Core", "MQTTプロトコル", "Lambda関数"]
        }
      ]
    },
    future: {
      title: "IoTの未来",
      subtitle: "自律的なマシン間相互作用に向けて",
      description: "検証済みデバイスがスマートコントラクトを通じて相互作用し、M2M取引を可能にします。スマートメーターによるエネルギー取引決済、物流センサーによる保険金支払いトリガー、EVによる充電料金支払い—すべて生データを公開することなく。",
      features: [
        "自律デバイス信頼",
        "マシン間取引",
        "ゼロ知識検証",
        "プライバシー保護商取引"
      ]
    },
    partners: {
      title: "戦略パートナー",
      japanOpenChain: {
        title: "Japan Open Chainパートナーシップ",
        points: [
          "KYC検証済みピア取引の規制コンプライアンス",
          "エンタープライズグレードの信頼性とコンプライアンス基盤",
          "日本のビジネス標準に対応したEthereum互換性"
        ]
      },
      ens: {
        title: "ENS統合",
        points: [
          "信頼できるIoTデバイスのアイデンティティレイヤーとしてのENS",
          "ZK + ENSによるプライバシー保護公共財",
          "IoTデータ検証のためのグローバル公共財レジストリ"
        ]
      },
      elizaOS: {
        title: "ElizaOSエージェント統合",
        points: [
          "IoTワークフローとZK検証のエージェント自動化",
          "ポリシー準拠・監査可能なデバイス／チェーン横断オートメーション",
          "センサー・LLM・オンチェーン連携のためのOSSアダプタ"
        ]
     }
    },
    footer: {
      contact: "お問い合わせ",
      privacy: "プライバシーポリシー",
      terms: "利用規約"
    }
  }
};

export default function Home() {
  const [language, setLanguage] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ja' : 'en');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  zkIoT
                </div>
                <div className="text-xs text-gray-400 -mt-1">Zero-Knowledge IoT</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#home" className="text-white hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  {t.nav.home}
                </a>
                <a href="#solution" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  {t.nav.solution}
                </a>
                <a href="#technology" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  {t.nav.technology}
                </a>
                <a href="#partners" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  {t.nav.partners}
                </a>
              </div>
            </div>

            {/* Language Toggle & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                <Languages className="w-4 h-4 mr-1" />
                {language.toUpperCase()}
              </Button>
              
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#home" className="block px-3 py-2 text-white hover:text-blue-400 text-base font-medium">
                {t.nav.home}
              </a>
              <a href="#solution" className="block px-3 py-2 text-gray-300 hover:text-blue-400 text-base font-medium">
                {t.nav.solution}
              </a>
              <a href="#technology" className="block px-3 py-2 text-gray-300 hover:text-blue-400 text-base font-medium">
                {t.nav.technology}
              </a>
              <a href="#partners" className="block px-3 py-2 text-gray-300 hover:text-blue-400 text-base font-medium">
                {t.nav.partners}
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-900/30 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Next-Generation IoT Framework</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t.hero.title}
              </span>
            </h1>
            
            <h2 className="text-xl md:text-2xl text-blue-400 font-semibold mb-6">
              {t.hero.subtitle}
            </h2>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              {t.hero.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
  {/* CTA → ダッシュボードへ（Viteなので a を使う） */}
  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3">
    <a href="https://zkiot-frontend-app.vercel.app/">
      {t.hero.cta}
      <ChevronRight className="w-5 h-5 ml-2" />
    </a>
  </Button>
  {/* Learn More → ページ内リンク */}
  <Button asChild variant="outline" size="lg" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white px-8 py-3">
    <a href="#solution">{t.hero.learn}</a>
  </Button>
</div>

          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.problem.title}
            </h2>
            <p className="text-lg text-gray-400">
              {t.problem.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {t.problem.items.map((item, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 p-6">
                <CardContent className="text-center p-0">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {item.stat}
                  </div>
                  <p className="text-gray-300">
                    {item.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.solution.title}
            </h2>
            <p className="text-lg text-gray-400">
              {t.solution.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {t.solution.features.map((feature, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 hover:border-blue-600/50 transition-colors">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.technology.title}
            </h2>
            <p className="text-lg text-gray-400">
              {t.technology.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {t.technology.categories.map((category, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <Badge key={itemIndex} variant="secondary" className="mr-2 mb-2 bg-blue-900/30 text-blue-300">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Future Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.future.title}
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              {t.future.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                {t.future.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {t.future.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 mx-auto">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-center text-white mb-2">
                  Machine Economy
                </h3>
                <p className="text-gray-400 text-center">
                  Autonomous transactions between verified IoT devices in a trustless environment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

     
{/* Partners Section */}
<section id="partners" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        {t.partners.title}
      </h2>
    </div>

    {/* 配列でまとめてマッピング */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[
        t.partners.japanOpenChain,
        t.partners.ens,
        t.partners.elizaOS
      ].map((partner, idx) => (
        <Card key={idx} className="bg-gray-900 border-gray-800">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              {partner.title}
            </h3>
            <ul className="space-y-3">
              {partner.points.map((point, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>



      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                zkIoT
              </div>
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">{t.footer.contact}</a>
              <a href="#" className="hover:text-blue-400 transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-blue-400 transition-colors">{t.footer.terms}</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © 2024 zkIoT. All rights reserved. Building the future of trusted IoT.
          </div>
        </div>
      </footer>
    </div>
  );
}
