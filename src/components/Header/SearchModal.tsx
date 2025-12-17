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
import _ from 'lodash'
import { TPostCard } from '../Card2/Card2'
import Loading from '../Button/Loading'
import { getPostDataFromPostFragment } from '@/utils/getPostDataFromPostFragment'
import ncFormatDate from '@/utils/formatDate'
import MyImage from '../MyImage'
import PostTypeFeaturedIcon from '../PostTypeFeaturedIcon/PostTypeFeaturedIcon'
import { useRouter } from 'next/router'

const T = getTrans()

/* ================= TYPES ================= */

interface PersonType {
	name: string
	uri: string
	type: string
	icon: typeof PostSearchIcon
}

type SearchItem = PersonType | TPostCard

/* ================= DATA ================= */

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

/* ================= COMPONENT ================= */

interface Props {
	renderTrigger?: () => ReactNode
	triggerClassName?: string
}

const SearchModal: FC<Props> = ({ renderTrigger, triggerClassName = '' }) => {
	const client = getApolloClient()
	const router = useRouter()

	const [isLoading, setIsLoading] = useState(false)
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [posts, setPosts] = useState<TPostCard[]>([])

	const GQL = gql(`
		query SearchFormQueryGetPostsBySearch($first: Int, $search: String) {
			posts(first: $first, where: { search: $search }) {
				nodes {
					...NcmazFcPostCardFields
				}
			}
		}
	`)

	function fetchData(search: string) {
		setIsLoading(true)
		client
			.query({
				query: GQL,
				variables: { search, first: 8 },
			})
			.then((res) => {
				setPosts((res?.data?.posts?.nodes as TPostCard[]) || [])
			})
			.finally(() => setIsLoading(false))
	}

	useEffect(() => {
		if (query) {
			fetchData(query)
			setPosts([])
		}
	}, [query])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value)
	}

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

					<div className="fixed inset-0 flex justify-center p-6">
						<DialogPanel className="w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-xl">

							{/* ✅ COMBOBOX ĐÃ FIX */}
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

									router.push(item.uri)
									setOpen(false)
								}}
							>
								<div className="relative">
									<ComboboxInput
										autoFocus
										className="w-full h-12 px-10"
										placeholder={T['Type to search...']}
										onChange={_.debounce(handleSearchChange, 200)}
									/>
								</div>

								{isLoading && <Loading />}

								<ComboboxOptions static as="ul">
									{query && posts.map((post) => (
										<ComboboxOption key={post.databaseId} value={post} as="li">
											{({ focus }) => (
												<CardPost post={post} focus={focus} />
											)}
										</ComboboxOption>
									))}

									{!query && explores.map((item) => (
										<ComboboxOption key={item.name} value={item} as="li">
											<span>{item.name}</span>
										</ComboboxOption>
									))}

									{quickActions.map((item) => (
										<ComboboxOption key={item.name} value={item} as="li">
											<span>{item.name}</span>
										</ComboboxOption>
									))}
								</ComboboxOptions>
							</Combobox>
						</DialogPanel>
					</div>
				</Dialog>
			</Transition>
		</>
	)
}

/* ================= CARD ================= */

const CardPost = ({ post, focus }: { post: TPostCard; focus: boolean }) => {
	const { title, date, categories, author, postFormats, featuredImage } =
		getPostDataFromPostFragment(post)

	return (
		<div className={clsx('flex gap-3 p-4', focus && 'bg-neutral-100')}>
			<div>
				<p className="text-xs">
					{author?.name} · {ncFormatDate(date)}
				</p>
				<h4 dangerouslySetInnerHTML={{ __html: title || '' }} />
			</div>

			{featuredImage?.sourceUrl && (
				<MyImage
					fill
					src={featuredImage.sourceUrl}
					alt={title || ''}
				/>
			)}

			<PostTypeFeaturedIcon postType={postFormats || ''} />
		</div>
	)
}

export default SearchModal
