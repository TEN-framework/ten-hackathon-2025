import { LogoIcon, SmallLogoIcon } from "@/components/Icon"
import { HeaderRoomInfo, HeaderActions } from "./HeaderComponents"
import { cn } from "@/lib/utils"

export default function Header(props: { className?: string; theme?: 'light' | 'night' }) {
  const { className, theme = 'night' } = props
  return (
    <>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'transparent',
          borderBottom: '1px solid transparent'
        }}
        className={cn(
          "flex items-center justify-between p-2 md:p-4 transition-colors",
          className,
        )}
      >
        <div className="flex items-center space-x-2">
          {/* <LogoIcon className="hidden h-5 md:block" />
          <SmallLogoIcon className="block h-4 md:hidden" /> */}
          <h1 className={cn("text-sm font-bold md:text-xl", theme === 'light' ? 'text-gray-800' : 'text-white')}>作业大师_TEN Agent</h1>
        </div>
        <HeaderRoomInfo />
        <HeaderActions />
      </header>
    </>
  )
}
