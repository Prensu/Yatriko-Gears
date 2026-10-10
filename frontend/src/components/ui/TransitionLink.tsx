import { forwardRef, type MouseEvent, type RefObject, type TouchEvent } from "react"
import { Link, useNavigate, type LinkProps } from "react-router-dom"
import { navigateWithTransition, preloadRoute, type PreloadRouteName } from "@/lib/viewTransition"

type TransitionLinkProps = LinkProps & {
  preload?: PreloadRouteName
  sharedElementRef?: RefObject<HTMLElement>
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  )
}

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  function TransitionLink(
    { preload, sharedElementRef, onClick, onMouseEnter, onFocus, onTouchStart, ...props },
    ref,
  ) {
    const navigate = useNavigate()
    const warmRoute = () => {
      if (preload) preloadRoute(preload)
    }

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      if (
        event.defaultPrevented ||
        !isPlainLeftClick(event) ||
        props.target === "_blank" ||
        props.reloadDocument
      ) return

      event.preventDefault()
      navigateWithTransition(navigate, props.to, {
        replace: props.replace,
        state: props.state,
        preventScrollReset: props.preventScrollReset,
        relative: props.relative,
        sharedElement: sharedElementRef?.current,
      })
    }

    return (
      <Link
        {...props}
        ref={ref}
        onClick={handleClick}
        onMouseEnter={(event) => { warmRoute(); onMouseEnter?.(event) }}
        onFocus={(event) => { warmRoute(); onFocus?.(event) }}
        onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => { warmRoute(); onTouchStart?.(event) }}
      />
    )
  },
)
