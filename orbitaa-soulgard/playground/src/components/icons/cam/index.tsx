import { IconProps } from "../types"
import camMuteSvg from "@/assets/cam_mute.svg"
import camUnMuteSvg from "@/assets/cam_unmute.svg"

interface ICamIconProps extends IconProps {
  active?: boolean
}

export const CamIcon = (props: ICamIconProps) => {
  const { active, color, ...rest } = props

  if (active) {
    return camUnMuteSvg({
      color: color || "#3D53F5",
      ...rest,
    })
  } else {
    return camMuteSvg({
      color: color || "#667085",
      ...rest,
    })
  }
}