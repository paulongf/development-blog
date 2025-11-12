import ImageKit from "imagekit";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import imagekit from "../lib/imageKit.js";

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const query = {};

    const {
      cat,
      author,
      search: searchQuery,
      sort: sortQuery,
      featured,
    } = req.query;

    if (cat) query.category = cat;
    if (searchQuery) query.title = { $regex: searchQuery, $options: "i" };
    if (author) {
      const user = await User.findOne({ username: author }).select("_id");
      if (!user)
        return res
          .status(404)
          .json({ message: "No posts found for this author" });
      query.user = user._id;
    }
    if (featured) query.isFeatured = true;

    let sortObj = { createdAt: -1 };
    if (sortQuery) {
      switch (sortQuery) {
        case "newest":
          sortObj = { createdAt: -1 };
          break;
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        case "popular":
          sortObj = { visit: -1 };
          break;
        case "trending":
          sortObj = { visit: -1 };
          query.createdAt = {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          };
          break;
      }
    }

    let posts = await Post.find(query)
      .populate("user", "username")
      .sort(sortObj)
      .limit(limit)
      .skip((page - 1) * limit);

    // Remove posts sem user (evita erro no frontend)
    posts = posts.filter((post) => post.user);

    const totalPosts = await Post.countDocuments(query);
    const hasMore = page * limit < totalPosts;

    res.status(200).json({ posts, hasMore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate(
      "user",
      "username img"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const createPost = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    if (!clerkUserId)
      return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findOne({ clerkUserId });
    if (!user) return res.status(404).json({ message: "User not found" });

    let slug = req.body.title.replace(/ /g, "-").toLowerCase();
    let existingPost = await Post.findOne({ slug });
    let counter = 2;

    while (existingPost) {
      slug = `${slug}-${counter}`;
      existingPost = await Post.findOne({ slug });
      counter++;
    }

    const newPost = new Post({ user: user._id, slug, ...req.body });
    const post = await newPost.save();
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const deletePost = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    if (!clerkUserId)
      return res.status(401).json({ message: "Not authenticated" });

    const role = req.auth.sessionClaims?.metadata?.role || "user";

    if (role === "admin") {
      await Post.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Post has been deleted" });
    }

    const user = await User.findOne({ clerkUserId });
    const deletedPost = await Post.findOneAndDelete({
      _id: req.params.id,
      user: user._id,
    });
    if (!deletedPost)
      return res
        .status(403)
        .json({ message: "You can delete only your posts!" });

    res.status(200).json({ message: "Post has been deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const featurePost = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const postId = req.body.postId;
    if (!clerkUserId)
      return res.status(401).json({ message: "Not authenticated" });

    const role = req.auth.sessionClaims?.metadata?.role || "user";
    if (role !== "admin")
      return res.status(403).json({ message: "You cannot feature posts!" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.isFeatured = !post.isFeatured;
    const updatedPost = await post.save();

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const uploadAuth = async (req, res) => {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};
