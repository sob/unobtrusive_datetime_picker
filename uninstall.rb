require 'fileutils'

js_dir = File.dirname(__FILE__) + '/../../../public/javascripts/'
date_js = js_dir + 'date.js'
datetimepicker_js = js_dir + 'datetimepicker.js'
lang_dir = js_dir + 'lang'
datetimepicker_css = File.dirname(__FILE__) + '/../../../public/stylesheets/datetimepicker.css'
images_dir = File.dirname(__FILE__) + '/../../../public/images/datetimepicker'

FileUtils.rm datetimepicker_js
FileUtils.rm date_js
FileUtils.rm_r lang_dir
FileUtils.rm datetimepicker_css
FileUtils.rm_r images_dir