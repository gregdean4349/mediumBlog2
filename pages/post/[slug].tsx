import { GetStaticProps } from 'next';
import Header from '../../components/Header';
import { sanityClient, urlFor } from '../../sanity';
import { Post } from '../../typings';
import PortableText from 'react-portable-text';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';

interface iFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

interface Props {
  post: Post;
}

function Post({ post }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<iFormInput>();

  const submitFormData: SubmitHandler<iFormInput> = (data) => {
    fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        console.log(data);
        setSubmitted(true);
      })
      .catch((err) => {
        console.log(err);
        setSubmitted(false);
      });
  };

  return (
    <main>
      <Header />

      <img
        src={urlFor(post.mainImage).url()!}
        className="h-40 w-full object-cover"
        alt=""
      />
      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="mb-2 text-xl font-light text-gray-500">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2">
          <img
            src={urlFor(post.author.image).url()!}
            className="h-10 w-10 rounded-full"
            alt=""
          />
          <p className="text-sm font-extralight">
            Blog post by{' '}
            <span className="font-normal text-green-600">
              {post.author.name}
            </span>{' '}
            - published on {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-10">
          <PortableText
            className=""
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="my-5 text-2xl font-bold" {...props} />
              ),
              h2: (props: any) => (
                <h1 className="my-5 text-xl font-bold" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>
      <hr className="my-5 mx-auto max-w-lg border border-yellow-500" />

      {submitted ? (
        <div className="my-10 mx-auto flex max-w-2xl flex-col rounded-lg border border-gray-500 bg-yellow-500 p-10 text-center text-white">
          <h3 className="text-2xl font-bold">
            Thank you for submitting your comment!
          </h3>
          <p className="mt-2 text-lg text-gray-500">
            Once it has been approved, it will appear below!
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(submitFormData)}
          className="mx-auto mb-10 flex max-w-2xl flex-col p-5"
        >
          <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
          <h4 className="text-3xl font-bold">Leave a comment below!</h4>
          <hr className="mt-2 py-3" />

          <input
            {...register('_id')}
            type="hidden"
            name="_id"
            value={post._id}
          />

          <label className="mb-5 block">
            <span className="text-gray-700">Name</span>
            <input
              {...register('name', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              type="text"
              placeholder="Enter your name"
            />
          </label>
          <label className="mb-5 block">
            <span className="text-gray-700">Email</span>
            <input
              {...register('email', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              type="email"
              placeholder="Enter your Email"
            />
          </label>
          <label className="mb-5 block">
            <span className="text-gray-700">Comment</span>
            <textarea
              {...register('comment', { required: true })}
              className="form-textarea mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              placeholder="Comment...."
              rows={8}
            />
          </label>

          {/* errors will return when field validation fails */}
          <div className="flex flex-col p-5">
            {errors.name && (
              <span className="text-red-500">Name is required</span>
            )}
            {errors.email && (
              <span className="text-red-500">Email is required</span>
            )}
            {errors.comment && (
              <span className="text-red-500">Comment is required</span>
            )}
          </div>
          <input
            type="submit"
            className="rounded-md bg-yellow-500 p-2 font-bold tracking-wide text-gray-700 shadow-lg hover:bg-yellow-400 focus:bg-yellow-500"
          />
        </form>
      )}

      {/* Comments */}

      <div className="my-10 mx-auto flex max-w-2xl flex-col space-y-2 rounded-lg p-10 shadow-md shadow-yellow-500">
        <h3 className="mb-5 text-4xl font-light">Comments</h3>
        <hr className="pb-2" />

        {post.comments.map((comment) => (
          <div key={comment._id}>
            <p>
              <span className="text-yellow-600">{comment.name}</span>:{' '}
              {comment.comment}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Post;
//* get the paths (slug.current) of ALL posts into an array
export const getStaticPaths = async () => {
  const query = `*[_type == "post"] {
    _id,
    slug {
      current
    }
  }`;

  const posts = await sanityClient.fetch(query);

  //* Map the array, assign results as params: (slugs retrieved in the array)
  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};
//* take the params and fetch the posts based on the slug(s) provided
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _createdAt,
    title,
    author-> {
      name,
      image
    },
    'comments': *[
      _type == "comment" && 
      post._ref == ^._id && 
      approved == true],
    description,
    mainImage,
    slug,
    body
  }`;

  //* take the params and fetch the posts based on the slug(s) provided
  const post = await sanityClient.fetch(query, { slug: params?.slug });

  //* no slug? display 404
  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
    revalidate: 60, //* Update old cached version after 60 seconds
  };
};
