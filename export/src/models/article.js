const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
  owners:[
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  title: {
    type:String,
    required:true,
    default: 'autocreated'
  },
  zoteroLink:{
    type:String,
    default: ''
  },
  workingVersion: {
    md: {
      type: String,
      default: ''
    },
    yaml: {
      type: String,
      default: ''
    },
    bib: {
      type: String,
      default: ''
    },
  },
  versions:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Version'
    }
  ],
  tags:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    }
  ]
}, {timestamps: true});

module.exports = mongoose.model('Article', articleSchema);
