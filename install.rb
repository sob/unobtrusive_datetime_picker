require 'fileutils'

# Install all the needed support files (CSS and JavaScript)

js_dir = File.dirname(__FILE__) + '/../../../public/javascripts/'
date_js = js_dir + 'date.js'
datetimepicker_js = js_dir + 'datetimepicker.js'
lang_dir = js_dir + 'lang'
datepicker_css = File.dirname(__FILE__) + '/../../../public/stylesheets/datetimepicker.css'
images_dir = File.dirname(__FILE__) + '/../../../public/images/datetimepicker'

FileUtils.cp File.dirname(__FILE__) + '/public/javascripts/datetimepicker.js', datetimepicker_js unless File.exists?(datetimepicker_js)
FileUtils.cp File.dirname(__FILE__) + '/public/javascripts/date.js', date_js unless File.exists?(date_js)
FileUtils.cp_r File.dirname(__FILE__) + '/public/javascripts/lang/', lang_dir unless File.exists?(lang_dir)
FileUtils.cp File.dirname(__FILE__) + '/public/stylesheets/datetimepicker.css', datepicker_css unless File.exists?(datepicker_css)
FileUtils.cp_r File.dirname(__FILE__) + '/public/images/', images_dir unless File.exists?(images_dir)