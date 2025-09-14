import Image from "next/image";

export default function Header() {
  return (
    <div className="bg-white text-black z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm lg:flex p-4 rounded-lg">
       
      {/* Agent Lunaの写真とチャットのテキスト */}
      <div className="flex items-center space-x-2">
          <Image
            className="rounded-full" // 写真を丸く表示
            src="/ai-agents.png" // 顔写真のパスを適切なものに変更してください
            alt="Ai Agent"
            width={70}
            height={70}
            priority
          />
          <span className="text-xl">Chat with Agent Luna</span> {/* テキストサイズを大きくする */}
      </div>
    </div>
  );
  }
