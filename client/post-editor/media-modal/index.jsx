/**
 * External dependencies
 */
import React, { Component } from 'react';
import { localize } from 'i18n-calypso';

import { connect } from 'react-redux';
import {
	findIndex,
	head,
	noop,
	map,
	partial,
	some,
	values,
	identity
} from 'lodash';

/**
 * Internal dependencies
 */
import MediaLibrary from 'my-sites/media-library';
import analytics from 'lib/analytics';
import {
	recordEvent,
	recordStat
} from 'lib/posts/stats';
import MediaModalSecondaryActions from './secondary-actions';
import MediaModalGallery from './gallery';
import MediaActions from 'lib/media/actions';
import MediaUtils from 'lib/media/utils';
import Dialog from 'components/dialog';
import accept from 'lib/accept';

import { getMediaModalView } from 'state/ui/media-modal/selectors';
import { getSite } from 'state/sites/selectors';
import { resetMediaModalView } from 'state/ui/media-modal/actions';
import { setEditorMediaModalView } from 'state/ui/editor/actions';
import { ModalViews } from 'state/ui/media-modal/constants';
import { deleteMedia } from 'state/media/actions';
import ImageEditor from 'blocks/image-editor';
import MediaModalDetail from './detail';

export class EditorMediaModal extends Component {
	static propTypes = {
		visible: React.PropTypes.bool,
		mediaLibrarySelectedItems: React.PropTypes.arrayOf( React.PropTypes.object ),
		onClose: React.PropTypes.func,
		site: React.PropTypes.object,
		siteId: React.PropTypes.number,
		labels: React.PropTypes.object,
		single: React.PropTypes.bool,
		defaultFilter: React.PropTypes.string,
		enabledFilters: React.PropTypes.arrayOf( React.PropTypes.string ),
		view: React.PropTypes.oneOf( values( ModalViews ) ),
		setView: React.PropTypes.func,
		resetView: React.PropTypes.func
	};

	static defaultProps = {
		visible: false,
		mediaLibrarySelectedItems: Object.freeze( [] ),
		onClose: noop,
		labels: Object.freeze( {} ),
		setView: noop,
		resetView: noop,
		translate: identity,
		view: ModalViews.LIST,
		imageEditorProps: {},
		deleteMedia: () => {}
	};

	constructor( props ) {
		super( ...props );
		this.state = this.getDefaultState( props );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.site && this.props.visible && ! nextProps.visible ) {
			MediaActions.setLibrarySelectedItems( nextProps.site.ID, [] );
		}

		if ( this.props.visible === nextProps.visible ) {
			return;
		}

		if ( nextProps.visible ) {
			this.setState( this.getDefaultState( nextProps ) );
		} else {
			this.props.resetView();
		}
	}

	componentDidMount() {
		this.statsTracking = {};
	}

	componentWillUnmount() {
		this.props.resetView();
		MediaActions.setLibrarySelectedItems( this.props.site.ID, [] );
	}

	getDefaultState( props ) {
		return {
			filter: '',
			detailSelectedIndex: 0,
			gallerySettings: props.initialGallerySettings
		};
	}

	isDisabled() {
		return some( this.props.mediaLibrarySelectedItems, function( item ) {
			const mimePrefix = MediaUtils.getMimePrefix( item );
			return item.transient && ( mimePrefix !== 'image' || ModalViews.GALLERY === this.props.view );
		}.bind( this ) );
	}

	confirmSelection = () => {
		const { view, mediaLibrarySelectedItems } = this.props;

		let value;
		if ( mediaLibrarySelectedItems.length ) {
			value = {
				type: ModalViews.GALLERY === view ? 'gallery' : 'media',
				items: mediaLibrarySelectedItems,
				settings: this.state.gallerySettings
			};
		}

		this.props.onClose( value );
	};

	setDetailSelectedIndex = index => {
		this.setState( {
			detailSelectedIndex: index
		} );
	};

	setNextAvailableDetailView() {
		if ( 1 === this.props.mediaLibrarySelectedItems.length ) {
			// If this is the only selected item, return user to the list
			this.props.setView( ModalViews.LIST );
		} else if ( this.getDetailSelectedIndex() === this.props.mediaLibrarySelectedItems.length - 1 ) {
			// If this is the last selected item, decrement to the previous
			this.setDetailSelectedIndex( Math.max( this.getDetailSelectedIndex() - 1, 0 ) );
		}
	}

	confirmDeleteMedia = accepted => {
		const { site, mediaLibrarySelectedItems } = this.props;

		if ( ! site || ! accepted ) {
			return;
		}

		let toDelete = mediaLibrarySelectedItems;
		if ( ModalViews.DETAIL === this.props.view ) {
			toDelete = toDelete[ this.getDetailSelectedIndex() ];
			this.setNextAvailableDetailView();
		}

		MediaActions.delete( site.ID, toDelete );
		analytics.mc.bumpStat( 'editor_media_actions', 'delete_media' );
		this.props.deleteMedia( site.ID, map( toDelete, 'ID' ) );
	};

	deleteMedia = () => {
		let selectedCount;

		if ( ModalViews.DETAIL === this.props.view ) {
			selectedCount = 1;
		} else {
			selectedCount = this.props.mediaLibrarySelectedItems.length;
		}

		const confirmMessage = this.props.translate(
			'Are you sure you want to permanently delete this item?',
			'Are you sure you want to permanently delete these items?',
			{ count: selectedCount }
		);

		accept( confirmMessage, this.confirmDeleteMedia );
	};

	onAddMedia = () => {
		recordStat( 'media_explorer_upload' );
		recordEvent( 'Upload Media' );
	};

	onAddAndEditImage = () => {
		MediaActions.setLibrarySelectedItems( this.props.site.ID, [] );

		this.props.setView( ModalViews.IMAGE_EDITOR );
	};

	restoreOriginalMedia = ( siteId, item ) => {
		if ( ! siteId || ! item ) {
			return;
		}

		MediaActions.update( siteId, { ID: item.ID, media_url: item.guid }, true );
	};

	onImageEditorDone = ( error, blob, imageEditorProps ) => {
		if ( error ) {
			this.onImageEditorCancel( imageEditorProps );

			return;
		}

		const {
			fileName,
			site,
			ID,
			resetAllImageEditorState
		} = imageEditorProps;

		const mimeType = MediaUtils.getMimeType( fileName );

		const item = {
			ID: ID,
			media: {
				fileName: fileName,
				fileContents: blob,
				mimeType: mimeType
			}
		};

		MediaActions.update( site.ID, item, true );

		resetAllImageEditorState();

		this.props.setView( ModalViews.DETAIL );
	};

	onImageEditorCancel = imageEditorProps => {
		const { mediaLibrarySelectedItems } = this.props;

		const item = mediaLibrarySelectedItems[ this.getDetailSelectedIndex() ];

		if ( ! item ) {
			this.props.setView( ModalViews.LIST );
			return;
		}

		this.props.setView( ModalViews.DETAIL );

		const {	resetAllImageEditorState } = imageEditorProps;

		resetAllImageEditorState();
	};

	getDetailSelectedIndex() {
		const { mediaLibrarySelectedItems } = this.props;
		const { detailSelectedIndex } = this.state;
		if ( detailSelectedIndex >= mediaLibrarySelectedItems.length ) {
			return 0;
		}
		return detailSelectedIndex;
	}

	onFilterChange = filter => {
		if ( filter !== this.state.filter ) {
			analytics.mc.bumpStat( 'editor_media_actions', 'filter_' + ( filter || 'all' ) );
		}

		this.setState( { filter } );
	};

	onScaleChange = () => {
		if ( ! this.statsTracking.scale ) {
			analytics.mc.bumpStat( 'editor_media_actions', 'scale' );
			this.statsTracking.scale = true;
		}
	};

	onSearch = search => {
		this.setState( {
			search: search || undefined
		} );

		if ( ! this.statsTracking.search ) {
			analytics.mc.bumpStat( 'editor_media_actions', 'search' );
			this.statsTracking.search = true;
		}
	};

	onClose = () => {
		this.props.onClose();
	};

	editItem( item ) {
		const { site, mediaLibrarySelectedItems, single } = this.props;
		if ( ! site ) {
			return;
		}

		// Append item to set of selected items if not already selected.
		let items = mediaLibrarySelectedItems;
		if ( ! items.some( ( selected ) => selected.ID === item.ID ) ) {
			if ( single ) {
				items = [ item ];
			} else {
				items = items.concat( item );
			}
			MediaActions.setLibrarySelectedItems( site.ID, items );
		}

		// Find and set detail selected index for the edited item
		this.setDetailSelectedIndex( findIndex( items, { ID: item.ID } ) );

		analytics.mc.bumpStat( 'editor_media_actions', 'edit_button_contextual' );
		analytics.ga.recordEvent( 'Media', 'Clicked Contextual Edit Button' );

		this.props.setView( ModalViews.DETAIL );
	}

	getFirstEnabledFilter() {
		if ( this.props.enabledFilters ) {
			return head( this.props.enabledFilters );
		}
	}

	getModalButtons() {
		if ( ModalViews.IMAGE_EDITOR === this.props.view ) {
			return;
		}

		const isDisabled = this.isDisabled();
		const selectedItems = this.props.mediaLibrarySelectedItems;
		const buttons = [
			<MediaModalSecondaryActions
				site={ this.props.site }
				selectedItems={ selectedItems }
				disabled={ isDisabled }
				onDelete={ this.deleteMedia } />,
			{
				action: 'cancel',
				label: this.props.translate( 'Cancel' )
			}
		];

		if ( ModalViews.GALLERY !== this.props.view && selectedItems.length > 1 &&
				! some( selectedItems, ( item ) => MediaUtils.getMimePrefix( item ) !== 'image' ) ) {
			buttons.push( {
				action: 'confirm',
				label: this.props.translate( 'Continue' ),
				isPrimary: true,
				disabled: isDisabled || ! this.props.site,
				onClick: partial( this.props.setView, ModalViews.GALLERY )
			} );
		} else {
			buttons.push( {
				action: 'confirm',
				label: this.props.labels.confirm || this.props.translate( 'Insert' ),
				isPrimary: true,
				disabled: isDisabled || 0 === selectedItems.length,
				onClick: this.confirmSelection
			} );
		}

		return buttons;
	}

	shouldClose() {
		return ( ModalViews.IMAGE_EDITOR !== this.props.view );
	}

	updateSettings = ( gallerySettings ) => {
		this.setState( { gallerySettings } );
	};

	renderContent() {
		let content;

		switch ( this.props.view ) {
			case ModalViews.DETAIL:
				content = (
					<MediaModalDetail
						site={ this.props.site }
						items={ this.props.mediaLibrarySelectedItems }
						selectedIndex={ this.getDetailSelectedIndex() }
						onRestoreItem={ this.restoreOriginalMedia }
						onSelectedIndexChange={ this.setDetailSelectedIndex } />
				);
				break;

			case ModalViews.GALLERY:
				content = (
					<MediaModalGallery
						site={ this.props.site }
						items={ this.props.mediaLibrarySelectedItems }
						settings={ this.state.gallerySettings }
						onUpdateSettings={ this.updateSettings } />
				);
				break;

			case ModalViews.IMAGE_EDITOR:
				const {
					site,
					imageEditorProps,
					mediaLibrarySelectedItems: items
				} = this.props;

				const selectedIndex = this.getDetailSelectedIndex();
				const media = items ? items[ selectedIndex ] : null;

				content = (
					<ImageEditor
						siteId={ site && site.ID }
						media={ media }
						onDone={ this.onImageEditorDone }
						onCancel={ this.onImageEditorCancel }
						{ ...imageEditorProps }
					/>
				);
				break;

			default:
				content = (
					<MediaLibrary
						site={ this.props.site }
						filter={ this.state.filter || this.props.defaultFilter || this.getFirstEnabledFilter() }
						enabledFilters={ this.props.enabledFilters }
						search={ this.state.search }
						onAddMedia={ this.onAddMedia }
						onAddAndEditImage={ this.onAddAndEditImage }
						onFilterChange={ this.onFilterChange }
						onScaleChange={ this.onScaleChange }
						onSearch={ this.onSearch }
						onEditItem={ this.editItem }
						fullScreenDropZone={ false }
						single={ this.props.single }
						scrollable />
				);
				break;
		}

		return content;
	}

	render() {
		return (
			<Dialog
				isVisible={ this.props.visible }
				buttons={ this.getModalButtons() }
				onClose={ this.onClose }
				additionalClassNames="editor-media-modal"
				shouldCloseOnOverlayClick={ this.shouldClose() }>
				{ this.renderContent() }
			</Dialog>
		);
	}
}

export default connect(
	( state, { site, siteId } ) => ( {
		view: getMediaModalView( state ),
		// [TODO]: Migrate toward dropping incoming site prop, accepting only
		// siteId and forcing descendant components to access via state
		site: site || getSite( state, siteId )
	} ),
	{
		setView: setEditorMediaModalView,
		resetView: resetMediaModalView,
		deleteMedia
	}
)( localize( EditorMediaModal ) );
