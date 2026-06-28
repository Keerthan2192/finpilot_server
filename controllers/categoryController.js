const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.userId },
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, color, icon, description } = req.body;

    const existing = await Category.findOne({ where: { userId: req.userId, name } });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      userId: req.userId,
      name,
      color: color || '#60A5FA',
      icon: icon || 'FiFolder',
      description,
    });

    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ where: { id, userId: req.userId } });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, color, icon, description } = req.body;
    await category.update({ name, color, icon, description });

    res.json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ where: { id, userId: req.userId } });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default category' });
    }

    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
