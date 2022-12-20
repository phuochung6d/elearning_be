import Category from '../models/category';
import lodash from 'lodash';
import chalk from 'chalk';
import slugify from 'slugify';

const getAllCategoriesByAdmin = async (req, res) => {
  try {
    const categories = await Category
      .find()
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      message: 'Get all categories successfully, try again',
      data: categories,
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get all categories fail, try again!',
      data: null
    });
  }
}

const getCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findOne({
      _id: categoryId
    });

    return res.status(200).json({
      success: true,
      message: 'Get one category successfully',
      data: category,
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get one category fail, try again!',
      data: null
    });
  }
}

const createCategory = async (req, res) => {
  try {
    const { name } = req.body.category;

    const newCategory = new Category({
      slug: slugify(name),
      name
    });

    await newCategory.save();

    return res.status(201).json({
      success: true,
      message: 'Category created',
      data: newCategory
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get all categories fail, try again!',
      data: null
    });
  }
}

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const value = {};
    ['name'].forEach(item => {
      if (Object.keys(req.body.category).includes(item))
        value[`${item}`] = req.body.category[`${item}`];
    });

    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        ...value
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Update category successfully',
      data: category
    })
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update category fail, try again!',
      data: null
    });
  }
}

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    await Category.findByIdAndDelete(
      categoryId
    );

    return res.status(200).json({
      success: true,
      message: 'Delete category successfully',
      data: null
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete category fail, try again!',
      data: null
    });
  }
}

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category
      .find()
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      message: 'Get all categories successfully, try again',
      data: categories,
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get all categories fail, try again!',
      data: null
    });
  }
}

const getCategoryDetail = async (req, res) => {
  try {
    const category = await Category
      .findOne({ slug: req.params.categorySlug });

    return res.status(200).json({
      success: true,
      message: 'Get all categories successfully, try again',
      data: category,
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get category detail fail, try again!',
      data: null
    });
  }
}

export {
  getAllCategoriesByAdmin,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryDetail,
}