function initSortableAdvImagesGallery(imagesId) {
    if(imagesId) {
        Sortable.create( imagesId, {
            animation: 200,
            sort: true,
            scroll: true,
            onSort: function (evt) {
                var images_items = $(evt.item).parent().find('.adv-images-gallery-item');
                var images_new_order = [];
                images_items.each(function(index, elem) {
                    var image = $(elem).find('.adv-images-gallery-item-holder');
                    images_new_order.push(image.data('image-id'));
                    $(elem).find('.adv-images-gallery-order').text(index + 1);
                });

                var parent = images_items.closest('.adv-images-gallery-list');
                var params = vext.getMediaParams(parent);
                params.multi = false;
                params.images_ids_order = images_new_order;

                $.post(vext_routes.ext_media_sort, params, function (response) {
                    if ( response
                        && response.data
                        && response.data.status
                        && response.data.status == 200 ) {

                        toastr.success(response.data.message);

                    } else {
                        toastr.error("Error sorting media.");
                    }
                });
            }
        });
    }
}

$('document').ready(function () {
    // ------------------------------
    //Init Sortable Images Sections
    // ------------------------------
    var sortable_images = $('.adv-images-gallery-list');
    sortable_images.each(function(index, elem) {
        initSortableAdvImagesGallery(document.getElementById($(elem).attr('id')));
    });

    // ------------------------------
    // Change Selected Image
    // ------------------------------
    vext_page_content.on("click", ".adv-images-gallery-change", function(evt){
        evt.preventDefault();

        console.log('12345');

        var image_owner = $(this).closest('.adv-images-gallery-list');
        var parent = $(this).closest('.adv-images-gallery-item-holder');

        var pos = vext.getDialogPosition(evt, true);

        if (!vext_change_image_form) {
            vext_change_image_form = $($('#change-image-template').prop('content')).find('#change-image-form');
        }

        vext_change_image_form.find('img').attr('src', parent.find('.adv-images-gallery-image img').attr('src'));
        vext_change_image_form.find('[name="_token"]').val(parent.data('token'));
        vext_change_image_form.find('[name="model"]').val(parent.data('model'));
        vext_change_image_form.find('[name="slug"]').val(parent.data('slug'));
        vext_change_image_form.find('[name="id"]').val(parent.data('id'));
        vext_change_image_form.find('[name="field"]').val(parent.data('field-name'));
        vext_change_image_form.find('[name="image_id"]').val(parent.data('image-id'));

        vext_change_image_form.find('[type="file"]').attr('name', parent.data('field-name'));

        if (vext_dialog) {
            vext_dialog.close();
        }

        vext_dialog = new $.Zebra_Dialog('', {
            'type': false,
            'modal': false,
            'position': [pos.x, pos.y],
            'buttons':  [
                {
                    caption: 'Change', callback: function() {

                        var form = $('#change-image-form')[0];
                        var data = new FormData(form);
                        //console.log(data);

                        $.ajax({
                            url: vext_routes.ext_media_change,
                            type: "POST",
                            data: data,
                            contentType: false,
                            cache: false,
                            processData:false,
                            success: function(response) {
                                if ( response
                                    && response.data
                                    && response.data.status
                                    && response.data.status == 200 ) {
                                    toastr.success(response.data.message);

                                    // Update Image and Filename
                                    parent.data('file-name', response.data.data.file_name);
                                    parent.data('image-id', response.data.data.file_id);
                                    parent.find('img').attr('src', response.data.data.file_url);
                                    parent.parent().find('.adv-images-gallery-filename').html(response.data.data.file_name_size);

                                } else {
                                    toastr.error("Error saving media.");
                                }
                            }
                        });
                    }
                },
                {
                    caption: 'Cancel', callback: function() {}
                }
            ],
            source: {inline: vext_change_image_form}
        });

        vext_dialog.update();

        $("#change_image_input").change(function(){
            console.log(this);
            vext.readURL(this);
        });

    });


    // ------------------------------
    // Edit Sortable ML Image Content
    // ------------------------------
    vext_page_content.on("click", ".adv-images-gallery-edit", function(evt){
        evt.preventDefault();

        var image_owner = $(this).closest('.adv-images-gallery-list');
        var parent = $(this).closest('.adv-images-gallery-item-holder');
        var title_holder = $(this).closest('.adv-images-gallery-item').find('.adv-images-gallery-title');

        var pos = vext.getDialogPosition(evt, image_owner.data('extra-fields'));

        var params = vext.getMediaParams(parent);

        if (vext_dialog) {
            vext_dialog.close();
        }

        vext_dialog = new $.Zebra_Dialog('', {
            'type': false,
            'modal': false,
            'max_width': '90%',
            'position': [pos.x, pos.y],
            'buttons':  [
                {
                    caption: 'Save', callback: function() {

                        var codemirror_editors = $('.codemirror_editor');
                        codemirror_editors.each(function(index, elem) {
                            var editor = elem.nextSibling.CodeMirror;
                            elem.value = editor.getValue();
                        });

                        var form_data = $(vext_dialog.body).find('form').serialize();
                        var title = $(vext_dialog.body).find('input[name*="title"]').val();

                        $.post(vext_routes.ext_media_update, form_data, function (response) {
                            if ( response
                                && response.data
                                && response.data.status
                                && response.data.status == 200 ) {
                                toastr.success(response.data.message);

                                if (title.length > 0) {
                                    title_holder.html(title);
                                } else {
                                    title_holder.html('<i>...</i>');
                                }
                            } else {
                                toastr.error("Error saving media.");
                            }
                        });
                    }
                },
                {
                    caption: 'Cancel', callback: function() {}
                }
            ],
            source: {
                ajax: {
                    method: "POST",
                    url: vext_routes.ext_media_form,
                    data: params,
                    complete: function(data) {
                        var codemirror_editors = $('.codemirror_editor');
                        codemirror_editors.each(function(index, elem) {
                            inst = CodeMirror.fromTextArea(elem, {
                                mode: elem.dataset.mode,
                                theme: elem.dataset.theme,
                                autoCloseTags: true,
                                lineNumbers: true
                            });
                        });
                        vext_dialog.update();
                    }
                }
            }
        });
    });

    // ------------------------------
    // Remove Image
    // ------------------------------
    vext_page_content.on('click', '.adv-images-gallery-remove', function () {
        var image = $(this).parent().parent();
        vext.dialogMediaRemove({
            'route': vext_routes.ext_media_remove,
            'params': vext.getMediaParams(image),
            'remove_element': image.parent()
        });
    });

    // ------------------------------
    // Mark images for bunch remove
    // ------------------------------
    vext_page_content.on("click", ".adv-images-gallery-mark", function(evt){
        $(this).closest('.adv-images-gallery-item-holder').toggleClass('remove');

        var images_list = $(this).closest('.adv-images-gallery-list');
        var bunch_button = $('#' + images_list.data('bunch-remove-button'));
        if (images_list.find('.remove').length > 0) {
            bunch_button.removeClass('hidden');
        } else {
            bunch_button.addClass('hidden');
        }
    });

    // ------------------------------
    // Remove Bunch of selected files
    // ------------------------------
    vext_page_content.on("click", ".bunch-adv-images-gallery-remove", function(evt){
        var images_list = $('#' + $(this).data('images-gallery-list'));
        $('.adv_confirm_delete_name').text(images_list.find('.remove').length);
        $('#adv_confirm_delete_modal').modal('show');
    });

});
