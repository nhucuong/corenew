import { RefObject, useCallback, useEffect, useState } from 'react'

interface UseSnapSliderProps {
	sliderRef: RefObject<HTMLDivElement | null>
}

interface UseSnapSliderReturn {
	scrollToNextSlide: () => void
	scrollToPrevSlide: () => void
	isAtStart: boolean
	isAtEnd: boolean
}

export default function useSnapSlider({
	sliderRef,
}: UseSnapSliderProps): UseSnapSliderReturn {
	const [isAtStart, setIsAtStart] = useState(true)
	const [isAtEnd, setIsAtEnd] = useState(false)

	const checkPosition = useCallback(() => {
		const el = sliderRef.current
		if (!el) return

		setIsAtStart(el.scrollLeft <= 0)
		setIsAtEnd(
			Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth,
		)
	}, [sliderRef])

	useEffect(() => {
		const el = sliderRef.current
		if (!el) return

		checkPosition()
		el.addEventListener('scroll', checkPosition)
		return () => el.removeEventListener('scroll', checkPosition)
	}, [checkPosition, sliderRef])

	const scrollToNextSlide = () => {
		sliderRef.current?.scrollBy({
			left: sliderRef.current.clientWidth,
			behavior: 'smooth',
		})
	}

	const scrollToPrevSlide = () => {
		sliderRef.current?.scrollBy({
			left: -sliderRef.current.clientWidth,
			behavior: 'smooth',
		})
	}

	return {
		scrollToNextSlide,
		scrollToPrevSlide,
		isAtStart,
		isAtEnd,
	}
}
