const populate = (data, field, subField) => {
  try {
    const _updated = JSON.parse(JSON.stringify(data));
    data?.[`${field}`]?.forEach((lesson, index) => {
      const found = data?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = found ? found : lesson?.section
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Aggregate course fail, try again!',
      data: null
    })
  }
}

export {
  populate
}