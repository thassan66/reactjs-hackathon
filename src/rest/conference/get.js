const list = async(req, res, next) => {
  try {
    res.send({result: 'Hello World'});
  } catch (e) {
    next(e);
  }
};

module.exports = {
  functions: [
    list,
  ],
};