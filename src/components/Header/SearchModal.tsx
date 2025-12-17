import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Dialog,
	DialogPanel,
	Transition,
	TransitionChild,
} from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { ArrowUpRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FC, ReactNode, useEffect, useState } from 'react'
import {
	CategoriesIcon,
	FilterVerticalIcon,
	PostSearchIcon,
	SearchIcon,
	UserSearchIcon,
} from '../Icons/Icons'
import clsx from 'clsx'
import getTrans from '@/utils/getTrans'
import { NC_SITE_SETTINGS } from '@/contains/site-settings'
import Empty from '../Empty'
import { gql } from '@/__generated__'
import { getApolloClient } from '@faustwp/core'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import _ from 'lodash'
import { TPostCard } from '../Card2/Card2'
import Loading from '../Button/Loading'
import { getPostDataFromPostFragment } from '@/utils/getPostDataFromPostFragment'
import ncFormatDate from '@/utils/formatDate'
import MyImage from '../MyImage'
import PostTypeFeaturedIcon from '../PostTypeFeaturedIcon/PostTypeFeaturedIcon'
import { useRouter } from 'next/router'

/* ================= TRANSLATION ================= */

const T = getTrans()

/* ================= TYPES ================= */

interface PersonType {
	name: string
	uri: string
	type: string
	icon: typeof PostSearchIcon
}

type SearchItem = PersonType | TPostCard

/* ================= STATIC DATA ================= */

const quickActions: PersonType[] = [
	{
		type: 'quick-action',
		name: T['Search posts'],
		icon: PostSearchIcon,
		uri: '/search/posts/',
	},
	{
		type: 'quick-action',
		name: T['Filter posts by'],
		icon: FilterVerticalIcon,
		uri: '/posts?search=',
	},
	{
		type: 'quick-action',
		name: T['Search authors'],
		icon: UserSearchIcon,
		uri: '/search/authors/',
	},
	{
		type: 'quick-action',
		name: T['Search categories'],
		icon: CategoriesIcon,
		uri: '/search/categories/',
	},
]

const explores: PersonType[] =
	NC_SITE_SETTINGS.search_page?.recommended_searches?.items
		?.map((item) => ({
			type: 'recommended_searches',
			name: item?.title || '',
			icon: SearchIcon,
			uri: item?.url || '/search/posts/' + item?.title,
		}))
		.filter(Boolean) || []

/* ================= GRAPHQL ================= */

const SEARCH_POSTS_QUERY = gql(`
	query SearchFormQueryGetPostsBySearch(
		$first: Int
		$search: String
	) {
		posts(first: $first, where: { search: $search }) {
			nodes {
				...NcmazFcPostCardFields
			}
		}
	}
`) as TypedDocumentNode<
	{
		posts: {
			nodes: TPostCard[]
		}
	},
	{
		search: string
		first: number
	}
>

/* ================= COMPONENT ================= */

interface Props {
	renderTrigger?: () => ReactNode
	triggerClassName?: string
}

const SearchModal: FC<Props> = ({ renderTrigger, triggerClassName = '' }) => {
	const client = getApolloClient()
	const router = useRouter()

	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [posts, setPosts] = useState<TPostCard[]>([])
	const [isLoading, setIsLoading] = useState(false)

	/* ================= FETCH ================= */

	const fetchData = (search: string) => {
		setIsLoading(true)
		client
			.query({
				query: SEARCH_POSTS_QUERY,
				variables: {
					search,
					first: 8,
				},
			})
			.then((res) => {
				setPosts(res.data.posts.nodes || [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}

	useEffect(() => {
		if (query) {
			setPosts([])
			fetchData(query)
		}
	}, [query])

	/* ================= RENDER ================= */

	return (
		<>
			<div onClick={() => setOpen(true)} className={triggerClassName}>
				{renderTrigger ? renderTrigger() : (
					<button className="flex h-10 w-10 items-center justify-center rounded-full">
						<SearchIcon className="h-5 w-5" />
					</button>
				)}
			</div>

			<Transition show={open} afterLeave={() => setQuery('')} appear>
				<Dialog className="relative z-50" onClose={setOpen}>
					<TransitionChild>
						<div className="fixed inset-0 bg-neutral-900/50" />
					</TransitionChild>

					<div className="fixed inset-0 z-10 flex justify-center p-6">
						<TransitionChild>
							<DialogPanel className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-800">

								{/* ================= COMBOBOX ================= */}

								<Combobox<SearchItem>
									onChange={(item) => {
										if (!item) return

										// Post
										if ('databaseId' in item) {
											router.push(item.uri || '')
											setOpen(false)
											return
										}

										// Quick action
										if (item.type === 'quick-action') {
											router.push(item.uri + query)
											setOpen(false)
											return
										}

										// Explore
										router.push(item.uri)
										setOpen(false)
									}}
								>
									<div className="relative">
										<MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
										<ComboboxInput
											autoFocus
											className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm focus:ring-0"
											placeholder={T['Type to search...']}
											onChange={_.debounce(
												(e) => setQuery(e.target.value),
												250,
											)}
										/>
										<button
											type="button"
											onClick={() => setOpen(false)}
											className="absolute right-4 top-1/2 -translate-y-1/2"
										>
											<XMarkIcon className="h-5 w-5" />
										</button>
									</div>

									{isLoading && (
										<div className="flex justify-center py-4">
											<Loading />
										</div>
									)}

									<ComboboxOptions static as="ul">
										{query !== '' && !isLoading && (
											<>
												{posts.length ? (
													posts.map((post) => (
														<ComboboxOption
															key={post.databaseId}
															value={post}
															as="li"
														>
															{({ focus }) => (
																<CardPost post={post} focus={focus} />
															)}
														</ComboboxOption>
													))
												) : (
													<div className="py-6 text-center">
														<Empty />
													</div>
												)}
											</>
										)}

										{query === '' && (
											<>
												{explores.map((item) => (
													<ComboboxOption
														key={item.name}
														value={item}
														as="li"
													>
														<span className="block px-4 py-2">
															{item.name}
														</span>
													</ComboboxOption>
												))}
											</>
										)}

										{quickActions.map((item) => (
											<ComboboxOption
												key={item.name}
												value={item}
												as="li"
											>
												<span className="block px-4 py-2">
													{item.name}
												</span>
											</ComboboxOption>
										))}
									</ComboboxOptions>
								</Combobox>
							</DialogPanel>
						</TransitionChild>
					</div>
				</Dialog>
			</Transition>
		</>
	)
}

/* ================= CARD ================= */

const CardPost = ({ post, focus }: { post: TPostCard; focus: boolean }) => {
	const { title, date, author, featuredImage, postFormats } =
		getPostDataFromPostFragment(post)

	return (
		<div className={clsx('flex gap-4 p-4', focus && 'bg-neutral-100')}>
			<div className="flex-1">
				<p className="text-xs text-neutral-500">
					{author?.name} · {ncFormatDate(date)}
				</p>
				<h4
					className="text-sm font-medium"
					dangerouslySetInnerHTML={{ __html: title || '' }}
				/>
			</div>

			{featuredImage?.sourceUrl && (
				<MyImage
					fill
					className="h-20 w-20 rounded-lg object-cover"
					src={featuredImage.sourceUrl}
					alt={title || ''}
				/>
			)}

			<PostTypeFeaturedIcon postType={postFormats || ''} />
		</div>
	)
}

export default SearchModal
